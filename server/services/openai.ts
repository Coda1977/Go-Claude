import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GoalAnalysis {
  feedback: string;
  firstAction: string;
}

export interface WeeklyContent {
  encouragement: string;
  actionItem: string;
  goalConnection: string;
}

class OpenAIService {
  async analyzeGoals(goals: string): Promise<GoalAnalysis> {
    try {
      const prompt = `You are Go Coach, an AI leadership development specialist with expertise in executive psychology, organizational behavior, and evidence-based leadership practices.

CONTEXT: You're analyzing initial leadership goals for a 12-week personalized development program. This is week 0 - the foundation-setting phase.

LEADERSHIP GOALS TO ANALYZE:
"${goals}"

TASK: Create a sophisticated analysis and actionable first step that demonstrates deep understanding of their specific aspirations.

ANALYSIS REQUIREMENTS:
- Identify underlying psychological drivers (achievement, influence, legacy, etc.)
- Reference specific phrases/themes from their goals
- Show understanding of leadership development stages
- Avoid generic business advice - be personally relevant

FIRST ACTION REQUIREMENTS:
- 30-60 minutes of focused work
- Concrete, observable action (not just reflection)
- Can be completed independently within 7 days
- Creates immediate momentum toward their specific goals
- Builds self-awareness through real-world application

TONE: Professional but warm, coach-like, encouraging yet challenging
Respond in JSON format:
{
  "feedback": "[2-3 sentences of nuanced analysis]",
  "firstAction": "[Specific, meaningful week 1 action that directly serves their goals]"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 600,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        feedback: result.feedback || "Your leadership aspirations reveal a sophisticated understanding of what drives meaningful influence and organizational impact.",
        firstAction: result.firstAction || "Conduct a 'leadership moment audit' this week: identify three recent interactions where you exercised leadership, noting what felt natural, what challenged you, and what you'd approach differently now."
      };
    } catch (error) {
      console.error("OpenAI goal analysis error:", error);
      // Fallback response
      return {
        feedback: "Your leadership aspirations reveal a sophisticated understanding of what drives meaningful influence and organizational impact.",
        firstAction: "Conduct a 'leadership moment audit' this week: identify three recent interactions where you exercised leadership, noting what felt natural, what challenged you, and what you'd approach differently now."
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
      const developmentalStage = weekNumber <= 3 ? "self-awareness" : 
                            weekNumber <= 8 ? "skill application" : 
                            "integration and mastery";

      const prompt = `You are Go Coach, an AI leadership development specialist guiding a leader through week ${weekNumber} of their 12-week transformation journey.

PROGRAM CONTEXT:
- Original leadership goals: "${goals}"
- Current development stage: ${developmentalStage}
- Previous week's action: "${previousAction}"
- Engagement level: ${engagementLevel}
- Week ${weekNumber} of 12 total weeks

DEVELOPMENTAL FRAMEWORK:
- Weeks 1-3: Foundation & Self-Awareness
- Weeks 4-8: Skill Building & Application
- Weeks 9-12: Integration & Mastery

THIS WEEK'S CONTENT REQUIREMENTS:

ENCOURAGEMENT (2-4 words + insight):
- Acknowledge specific progress from last week's action
- Build confidence while maintaining momentum

ACTION ITEM:
- 30-60 minutes of focused work
- Builds directly on previous weeks' learning
- Appropriate challenge level for ${developmentalStage} stage
- Connects to their specific goals, not generic leadership advice
- Creates measurable progress toward their vision

GOAL CONNECTION:
- Show how this week's action advances their original aspirations
- Reference specific elements from their goals
- Demonstrate cumulative development understanding

TONE: Supportive coach who sees their potential and challenges them appropriately

Respond in JSON format:
{
  "encouragement": "[2-4 words acknowledging last week + brief insight]",
  "actionItem": "[Sophisticated, specific action for this week]",
  "goalConnection": "[One sentence tying to their leadership vision]"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 600,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        encouragement: result.encouragement || "Great progress on your leadership journey so far!",
        actionItem: result.actionItem || "Continue building on last week's momentum with a new leadership challenge.",
        goalConnection: result.goalConnection || "This week's action directly supports your original leadership goals."
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

  async generateSubjectLine(weekNumber: number, actionItem: string): Promise<string> {
    try {
      const prompt = `Generate a compelling, professional email subject line for a leadership coaching email.

CONTEXT:
- Week: ${weekNumber} of 12-week program
- Action Item: ${actionItem}

REQUIREMENTS:
- 6-8 words maximum
- Professional but engaging tone
- Creates anticipation and relevance
- Avoids generic business language

EXAMPLES:
- "Your Week 3 Leadership Challenge"
- "Building Trust: This Week's Focus" 
- "Leadership Growth: Week 5 Action"
- "Week 4: Expanding Your Influence"

Subject line:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
      });

      const subject = response.choices[0].message.content?.trim() || `Week ${weekNumber}: Your Leadership Action`;
      
      // Remove quotes if present
      return subject.replace(/^["'](.*)["']$/, '$1');
    } catch (error) {
      console.error("OpenAI subject line error:", error);
      return `Week ${weekNumber}: Your Leadership Challenge`;
    }
  }
}

export const openaiService = new OpenAIService();
