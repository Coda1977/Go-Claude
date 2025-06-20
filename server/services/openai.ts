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
      const prompt = `You are Go Leadership, a renowned executive coach with 20+ years working with Fortune 500 leaders.

ANALYZE THESE LEADERSHIP GOALS:
"${goals}"

Provide deep insights about what's driving these goals and create a sophisticated first action that builds meaningful momentum.

Requirements:
- Reference specific elements from their goals
- Show genuine understanding of leadership psychology and management principles
- Create a specific, engaging action (not generic advice)
- Write warmly but professionally
- Action should take 30-60 minutes
- Action should be something they need to do in the real world, not just reflecting
- Action should be something they can do on their own, not requiring external input
- Action should be something they can do in a week
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

      const prompt = `You are Go Leadership, a renowned executive coach with 20+ years working, continuing to coach a leader in week ${weekNumber} of 12.

Context:
- Original goals: "${goals}"
- Development stage: ${developmentalStage}
- Last week's action: "${previousAction}"
- Current engagement: ${engagementLevel}

Create a sophisticated weekly email that:
1. Acknowledges their specific progress meaningfully
2. Builds psychologically on previous weeks
3. Provides an action that directly serves their goals
4. Feels personally relevant and engaging

Requirements:
- Reference leadership psychology principles
- Create actions that take 30-60 minutes
- Maintain optimal challenge (not too easy/hard)
- Show cumulative growth understanding

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
