
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GoalAnalysis {
  feedback: string;
  goalActions: Array<{
    goal: string;
    action: string;
  }>;
}

export interface WeeklyContent {
  encouragement: string;
  actionItem: string;
  goalConnection: string;
}

// Enhanced interfaces for new prompt structure
interface EnhancedGoalAnalysis {
  goals: Array<{
    goalText: string;
    analysis: string;
    week1Action: string;
    successCriteria: string;
    reflectionPrompt: string;
  }>;
  overallFeedback: string;
}

interface EnhancedWeeklyContent {
  weeklyActions: Array<{
    goalText: string;
    action: string;
    buildingOn: string;
  }>;
  weeklyTheme: string;
  encouragement: string;
}

class OpenAIService {
  async analyzeGoals(goals: string[], userContext?: any, retryCount = 0): Promise<GoalAnalysis> {
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
    
    try {
      // Build context-aware prompt
      const contextInfo = userContext ? `
LEADERSHIP CONTEXT:
- Current Role: ${userContext.currentRole}
- Team Size: ${userContext.teamSize}
- Industry: ${userContext.industry}
- Years in Leadership: ${userContext.yearsInLeadership}
- Work Environment: ${userContext.workEnvironment}
- Organization Size: ${userContext.organizationSize || 'Not specified'}
- Primary Challenges: ${userContext.leadershipChallenges?.join(', ') || 'General leadership development'}
` : '';

      const prompt = `You are Go Coach, an expert leadership development specialist.

TASK: Analyze individual leadership goals and create immediate week 1 actions.
${contextInfo}
LEADERSHIP GOALS (one per line):
${goals.map((goal, index) => `Goal ${index + 1}: "${goal}"`).join('\n')}

INSTRUCTIONS:
For each goal, provide:
1. ANALYSIS: Brief insight about what this goal reveals about their leadership development
2. WEEK 1 ACTION: Context-appropriate immediate action to begin progress on this exact goal

WEEK 1 ACTION REQUIREMENTS (per goal):
- Maximum 30 minutes
- IMMEDIATE ACTION - no observation periods or self-assessment phases
- If you reference any framework/model (SBI, STAR, etc.), explain exactly how to use it
- Real-world practice that creates immediate progress
- Can be completed independently within 7 days
- Directly serves the stated goal
- ADAPTED FOR THEIR CONTEXT: Consider their role, team size, industry, and work environment
- Include SUCCESS CRITERIA: "You'll know this worked when..."
- Include REFLECTION PROMPT: "After completing this, note..."

Provide your response as a valid json object in this exact format:
{
  "goals": [
    {
      "goalText": "Exact goal text from input",
      "analysis": "1-2 sentences analyzing what this goal reveals in their context",
      "week1Action": "Context-specific, immediate action with frameworks explained step-by-step",
      "successCriteria": "You'll know this worked when... [specific observable outcomes]",
      "reflectionPrompt": "After completing this, note... [specific learning questions]"
    }
  ],
  "overallFeedback": "2 sentences about their leadership development potential given their context"
}

EXAMPLE OUTPUT FOR MANAGER WITH 6-15 TEAM, TECH INDUSTRY, HYBRID WORK:
{
  "goals": [
    {
      "goalText": "Give more constructive feedback to team members",
      "analysis": "This goal shows you understand that leadership impact comes through developing others, which is critical for managing a mid-sized tech team effectively.",
      "week1Action": "Choose one team member and schedule a 15-minute virtual or in-person feedback conversation this week using the SBI method: 1) Situation - describe when/where the behavior occurred, 2) Behavior - state what you observed without interpretation, 3) Impact - explain the effect it had. For hybrid teams, be specific about context: 'In Tuesday's sprint planning call (S), when you provided detailed alternative solutions while others were still presenting (B), it demonstrated strong technical thinking but may have made others hesitant to share their ideas (I).' Practice with both positive recognition and improvement areas.",
      "successCriteria": "You'll know this worked when the team member thanks you for the clarity, asks follow-up questions, or you observe immediate behavior change in the next team interaction.",
      "reflectionPrompt": "After completing this, note: How did their body language/tone change during the conversation? What part of SBI felt most natural vs. challenging? How might you adapt this for remote vs. in-person team members?"
    },
    {
      "goalText": "Be more strategic in decision-making",
      "analysis": "Strategic thinking at your level means balancing technical debt, team capacity, and business priorities - essential for tech leadership success.",
      "week1Action": "Take your next technical or team decision this week and spend 20 minutes using the Tech Leader's Strategic Framework: 1) What business problem are we solving? 2) How does this impact our sprint goals and team capacity? 3) What are 3 alternative technical approaches? 4) What does success look like for users and business in 3 months? 5) What technical or team risks need mitigation? Document in your team's decision log (Confluence, Notion, etc.) and share your reasoning with your team.",
      "successCriteria": "You'll know this worked when your decision documentation helps a team member understand the 'why' behind your choice, or when you catch a potential issue before implementation.",
      "reflectionPrompt": "After completing this, note: Which strategic question revealed something you hadn't considered? How did documenting your reasoning change your confidence in the decision? What would you add to this framework for future decisions?"
    }
  ],
  "overallFeedback": "Your goals show sophisticated leadership awareness perfect for your current role managing a tech team. Combining people development with strategic thinking will position you excellently for senior leadership roles."
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      const result: EnhancedGoalAnalysis = JSON.parse(response.choices[0].message.content || "{}");
      
      // Convert enhanced format to existing interface for compatibility
      return {
        feedback: result.overallFeedback || this.generateContextualFallbackFeedback(userContext),
        goalActions: result.goals?.map(goal => ({
          goal: goal.goalText,
          action: `${goal.week1Action}\n\nSUCCESS CRITERIA: ${goal.successCriteria}\n\nREFLECTION: ${goal.reflectionPrompt}`
        })) || goals.map(goal => ({
          goal,
          action: this.generateContextualFallbackAction(goal, userContext)
        }))
      };
    } catch (error) {
      console.error(`OpenAI goal analysis error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying OpenAI analysis in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.analyzeGoals(goals, retryCount + 1);
      }
      
      // If all retries failed, throw the error to be handled upstream
      throw new Error(`OpenAI service failed after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateWeeklyContent(
    goals: string,
    weekNumber: number,
    previousAction: string,
    engagementLevel: string = "good",
    userContext?: any
  ): Promise<WeeklyContent> {
    try {
      // Parse goals string into array for enhanced prompt
      const userGoals = goals.split('\n').filter(goal => goal.trim());
      
      const prompt = `You are Go Coach, continuing a leader's development in week ${weekNumber} of 12.

CONTEXT:
- User's Leadership Goals: ${JSON.stringify(userGoals)}
- Week Number: ${weekNumber}
- Previous Week's Action: "${previousAction}"

APPROACH: Direct action and skill building - no observation phases or assessment periods.

TASK: Generate one immediate action for EACH goal this week that builds on previous weeks.

ACTION REQUIREMENTS (per goal):
- Maximum 30 minutes
- IMMEDIATE ACTION - jump straight into practice
- If you reference any framework/model, explain exactly how to use it step-by-step
- Builds on previous weeks but introduces new elements/challenges
- Different from previous actions (show progression)
- Creates real leadership behavior change

PROGRESSION LOGIC - Action-Focused Examples:
Goal: "Give better feedback"
- Week 1: Use SBI method with one person
- Week 2: Practice feedback in a group setting
- Week 3: Give feedback on a sensitive/difficult topic
- Week 4: Teach someone else how to give feedback using SBI
- Week 5: Handle defensive reactions using the COIN method
- etc.

RESPONSE FORMAT:
{
  "weeklyActions": [
    {
      "goalText": "Exact goal text",
      "action": "Detailed, immediate action with any frameworks/methods explained step-by-step",
      "buildingOn": "Brief note about how this advances from previous weeks"
    }
  ],
  "weeklyTheme": "Overall action focus connecting all goals this week",
  "encouragement": "2 sentences motivating continued action and growth"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result: EnhancedWeeklyContent = JSON.parse(response.choices[0].message.content || "{}");
      
      // Convert enhanced format to existing interface
      const primaryAction = result.weeklyActions?.[0]?.action || 
        `For week ${weekNumber}, focus on implementing one small leadership improvement based on your recent learnings.`;

      return {
        encouragement: result.encouragement || "Thank you for your continued commitment to leadership growth.",
        actionItem: primaryAction,
        goalConnection: result.weeklyTheme || "Each week builds toward achieving your leadership vision."
      };
    } catch (error) {
      console.error("OpenAI weekly content error:", error);
      // Fallback response
      return {
        encouragement: "Thank you for your continued commitment to leadership growth.",
        actionItem: `For week ${weekNumber}, focus on implementing one small leadership improvement based on your recent learnings.`,
        goalConnection: "Each week builds toward achieving your leadership vision."
      };
    }
  }

  async generateSubjectLine(weekNumber: number, actionItem: string, weeklyTheme?: string): Promise<string> {
    try {
      const prompt = `Generate a compelling email subject line for a leadership development email.

CONTEXT:
- Week: ${weekNumber} of 12
- Weekly Theme: ${weeklyTheme || 'Leadership Development'}

REQUIREMENTS:
- 6-8 words maximum
- Action-focused language (not "reflection" or "assessment")
- Creates anticipation for immediate practice
- Professional but engaging tone
- References the skill being practiced

EXAMPLES:
- "Week 4: Advanced Feedback Skills"
- "Strategic Decisions: Next Level"
- "Week 7: Difficult Conversations"
- "Leadership Action: Week 3"
- "New Challenge: Delegation Mastery"

Subject line:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
      });

      const subject = response.choices[0].message.content?.trim() || `Week ${weekNumber}: Your Leadership Challenge`;
      
      // Remove quotes if present
      return subject.replace(/^["'](.*)["']$/, '$1');
    } catch (error) {
      console.error("OpenAI subject line error:", error);
      return `Week ${weekNumber}: Your Leadership Challenge`;
    }
  }

  // Enhanced fallback system with context awareness
  private generateContextualFallbackFeedback(userContext?: any): string {
    if (!userContext) {
      return "Your leadership aspirations reveal a sophisticated understanding of what drives meaningful influence and organizational impact.";
    }

    const roleLevel = userContext.currentRole;
    const industry = userContext.industry;
    const teamSize = userContext.teamSize;

    if (roleLevel === "IC") {
      return `As an individual contributor in ${industry}, your leadership goals show readiness to expand your influence beyond direct deliverables. This foundation will serve you well as you grow into formal leadership roles.`;
    } else if (roleLevel === "Manager" && teamSize === "1-5") {
      return `Your goals reflect the strategic thinking needed to effectively lead a small ${industry} team. This combination of people focus and systems awareness is exactly what scales teams successfully.`;
    } else if (roleLevel === "Director" || roleLevel === "VP") {
      return `Your leadership goals demonstrate the executive presence needed for senior ${industry} leadership. This focus on both strategic impact and organizational development will drive significant business results.`;
    }

    return `Your leadership goals show excellent alignment with your current role and ${industry} industry needs. This self-awareness will accelerate your development significantly.`;
  }

  private generateContextualFallbackAction(goal: string, userContext?: any): string {
    if (!userContext) {
      return `Conduct a focused 30-minute reflection on "${goal}": identify one recent situation where progress toward this goal was possible, noting what worked, what didn't, and one specific action you can take this week.\n\nSUCCESS CRITERIA: You'll know this worked when you have a clear, specific action plan for next week.\n\nREFLECTION: After completing this, note what patterns you see in your leadership approach and what one skill would have the biggest impact.`;
    }

    const role = userContext.currentRole;
    const teamSize = userContext.teamSize;
    const workEnv = userContext.workEnvironment;
    const industry = userContext.industry;

    // Role-specific fallback actions
    if (role === "IC") {
      return `Take a 20-minute action this week to practice "${goal}" in your current IC role: identify one project meeting, technical discussion, or cross-team collaboration where you can demonstrate this leadership skill. Focus on influence without authority.\n\nSUCCESS CRITERIA: You'll know this worked when a colleague acknowledges your contribution or asks for your input on a similar situation.\n\nREFLECTION: After completing this, note how you can expand this influence in your current role before seeking formal leadership opportunities.`;
    }

    if (role === "Manager" && teamSize === "0") {
      return `As a manager preparing to build your team, spend 25 minutes this week on "${goal}" by: 1) Identifying one skill area where you'll need to coach future team members, 2) Practicing this coaching approach with a peer or in a cross-functional meeting, 3) Documenting your approach for future use.\n\nSUCCESS CRITERIA: You'll know this worked when you feel more confident about developing others in this area.\n\nREFLECTION: After completing this, note what leadership patterns will be most important as you grow your team.`;
    }

    if (teamSize !== "0") {
      const teamContext = teamSize === "1-5" ? "small team" : teamSize === "6-15" ? "mid-sized team" : "large team";
      const envContext = workEnv === "Remote" ? "virtual setting" : workEnv === "Hybrid" ? "hybrid environment" : "in-person setting";
      
      return `This week, practice "${goal}" with your ${teamContext} in a ${envContext}: Choose one upcoming team interaction (meeting, 1:1, decision point) and deliberately apply this leadership skill. Adapt your approach for ${workEnv.toLowerCase()} work dynamics.\n\nSUCCESS CRITERIA: You'll know this worked when you observe improved team engagement, clearer outcomes, or positive feedback from a team member.\n\nREFLECTION: After completing this, note how ${workEnv.toLowerCase()} work affects your leadership approach and what adjustments enhance your impact.`;
    }

    // Industry-specific fallbacks
    if (industry === "Technology") {
      return `Apply "${goal}" to a technical leadership challenge this week: Choose one code review, architecture decision, or technical discussion where you can practice this skill. Balance technical depth with leadership impact.\n\nSUCCESS CRITERIA: You'll know this worked when technical decisions improve AND team members feel heard and developed.\n\nREFLECTION: After completing this, note how to integrate people leadership with technical leadership for maximum effectiveness.`;
    }

    // Default contextual action
    return `Practice "${goal}" in your ${industry} ${role} context this week: Identify one typical ${industry} challenge or meeting where you can apply this leadership skill for 20-30 minutes of focused practice.\n\nSUCCESS CRITERIA: You'll know this worked when you handle the situation more effectively than usual.\n\nREFLECTION: After completing this, note what aspects of ${industry} leadership require different approaches than other fields.`;
  }
}

export const openaiService = new OpenAIService();
