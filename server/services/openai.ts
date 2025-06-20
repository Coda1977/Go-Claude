
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
  async analyzeGoals(goals: string[]): Promise<GoalAnalysis> {
    try {
      const prompt = `You are Go Coach, an expert leadership development specialist.

TASK: Analyze individual leadership goals and create immediate week 1 actions.

LEADERSHIP GOALS (one per line):
${goals.map((goal, index) => `Goal ${index + 1}: "${goal}"`).join('\n')}

INSTRUCTIONS:
For each goal, provide:
1. ANALYSIS: Brief insight about what this goal reveals about their leadership development
2. WEEK 1 ACTION: Immediate action to begin progress on this exact goal

WEEK 1 ACTION REQUIREMENTS (per goal):
- Maximum 30 minutes
- IMMEDIATE ACTION - no observation periods or self-assessment phases
- If you reference any framework/model (SBI, STAR, etc.), explain exactly how to use it
- Real-world practice that creates immediate progress
- Can be completed independently within 7 days
- Directly serves the stated goal

Provide your response as a valid json object in this exact format:
{
  "goals": [
    {
      "goalText": "Exact goal text from input",
      "analysis": "1-2 sentences analyzing what this goal reveals",
      "week1Action": "Specific, immediate action with any frameworks explained"
    }
  ],
  "overallFeedback": "2 sentences about their leadership development potential"
}

EXAMPLE OUTPUT:
{
  "goals": [
    {
      "goalText": "Give more constructive feedback to team members",
      "analysis": "This goal shows you understand that leadership impact comes through developing others, not just directing them.",
      "week1Action": "Choose one team member and have a 15-minute feedback conversation this week using the SBI method: 1) Situation - describe when/where the behavior occurred, 2) Behavior - state what you observed without interpretation, 3) Impact - explain the effect it had. Example: 'In yesterday's meeting (S), when you interrupted Sarah twice (B), it seemed to shut down her contributions and the team became quieter (I).' Practice both positive and constructive feedback."
    },
    {
      "goalText": "Be more strategic in decision-making",
      "analysis": "Strategic thinking means seeing beyond immediate problems to systemic solutions and longer-term implications.",
      "week1Action": "Take your next decision this week and spend 20 minutes using the 5-Question Strategic Framework before deciding: 1) What problem are we really solving? 2) Who are all the stakeholders affected? 3) What are 3 alternative approaches? 4) What does success look like in 6 months? 5) What could go wrong and how do we mitigate it? Document your answers and implement the decision based on this analysis."
    }
  ],
  "overallFeedback": "Your goals show excellent leadership intuition - focusing on people development and systems thinking. This combination will accelerate your impact significantly."
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
        feedback: result.overallFeedback || "Your leadership aspirations reveal a sophisticated understanding of what drives meaningful influence and organizational impact.",
        goalActions: result.goals?.map(goal => ({
          goal: goal.goalText,
          action: goal.week1Action
        })) || goals.map(goal => ({
          goal,
          action: "Conduct a focused 30-minute reflection on this goal: identify one recent situation where progress toward this goal was possible, noting what worked, what didn't, and one specific action you can take this week."
        }))
      };
    } catch (error) {
      console.error("OpenAI goal analysis error:", error);
      // Fallback response
      return {
        feedback: "Your leadership aspirations reveal a sophisticated understanding of what drives meaningful influence and organizational impact.",
        goalActions: goals.map(goal => ({
          goal,
          action: "Conduct a focused 30-minute reflection on this goal: identify one recent situation where progress toward this goal was possible, noting what worked, what didn't, and one specific action you can take this week."
        }))
      };
    }
  }

  async generateWeeklyContent(
    goals: string,
    weekNumber: number,
    previousAction: string,
    engagementLevel: string = "good"
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
}

export const openaiService = new OpenAIService();
