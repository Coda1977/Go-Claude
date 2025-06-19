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
      const prompt = `You are an expert leadership coach with deep experience in behavioral psychology and adult development.

Analyze these leadership goals and provide:
1. Constructive, encouraging feedback (2-3 sentences)
2. ONE specific, actionable item for week 1 that begins their leadership journey

Goals: ${goals}

Respond in JSON format:
{
  "feedback": "Your analysis here",
  "firstAction": "Specific week 1 action"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        feedback: result.feedback || "Thank you for sharing your leadership goals. Let's start your journey with actionable steps.",
        firstAction: result.firstAction || "Schedule a 15-minute conversation with a team member to discuss how you can better support their success."
      };
    } catch (error) {
      console.error("OpenAI goal analysis error:", error);
      // Fallback response
      return {
        feedback: "Thank you for sharing your leadership goals. I'm excited to support your growth journey over the next 12 weeks.",
        firstAction: "Schedule a 15-minute one-on-one with a team member this week and ask: 'How can I better support your success?'"
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
      const prompt = `You are a consistent, wise leadership coach helping someone achieve their goals through a 12-week program.

Context:
- Original goals: ${goals}
- Current week: ${weekNumber}
- Previous action: ${previousAction}
- User engagement: ${engagementLevel}

Generate:
1. Brief acknowledgment of last week's action (encouraging, specific)
2. NEW action item for this week (specific, achievable, builds on previous work)
3. Connection to their original goals (motivational tie-back)

Tone: Professional, encouraging, psychologically informed. Avoid repeating previous actions.

Respond in JSON format:
{
  "encouragement": "2-3 sentences acknowledging last week",
  "actionItem": "Specific action for this week",
  "goalConnection": "How this connects to their original goals"
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

Week: ${weekNumber}
Action Item: ${actionItem}

Make it engaging but professional, around 6-8 words. Examples:
- "Your Week 3 Leadership Challenge"
- "Building Trust: This Week's Focus"
- "Leadership Growth: Week 5 Action"

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
