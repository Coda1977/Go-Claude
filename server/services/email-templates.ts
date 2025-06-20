import { User } from "@shared/schema";
import { GoalAnalysis, WeeklyContent } from "./openai";

export class EmailTemplates {
  static generateWelcomeEmail(user: User, goalAnalysis: GoalAnalysis, emailId?: number): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    const trackingPixel = emailId ? `<img src="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/email/track/${emailId}" width="1" height="1" style="display:none;" alt="" />` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GO - Your Leadership Journey Begins</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px 10px !important; }
            .content { padding: 30px 20px !important; }
            .header { padding: 30px 20px !important; }
            h1 { font-size: 28px !important; }
            h2 { font-size: 24px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F0E8; line-height: 1.6;">

        <!-- Modern, clean header -->
        <div style="background: #003566; color: #FFFFFF; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 36px; font-weight: 600; letter-spacing: 3px;">GO</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your Leadership Development Journey</p>
        </div>

        <!-- Clean content area -->
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px;">
          <h2 style="color: #1A1A1A; font-size: 28px; font-weight: 600; margin: 0 0 24px 0;">
            Welcome, ${capitalizedName}
          </h2>

          <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
            I've carefully reviewed your leadership goals and I'm genuinely excited about the transformative journey ahead of us.
          </p>

          <!-- Goal Analysis Section -->
          <div style="background: #F5F0E8; border-left: 4px solid #003566; padding: 24px; border-radius: 8px; margin: 32px 0;">
            <h3 style="color: #003566; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">✨ My Analysis of Your Goals</h3>
            <div style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${EmailTemplates.formatAnalysisText(goalAnalysis.feedback)}
            </div>
          </div>

          <!-- Modern action box -->
          <div style="background: #F5F0E8; border-left: 4px solid #FFD60A; padding: 24px; border-radius: 8px; margin: 32px 0;">
            <h3 style="color: #003566; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">🎯 Your First Action</h3>
            <div style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${EmailTemplates.formatActionText(goalAnalysis.firstAction)}
            </div>
          </div>

          <!-- Journey continuation message -->
          <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 32px 0; text-align: center;">
            <p style="margin: 0; color: #4A4A4A; font-size: 16px; line-height: 1.6;">
              This self-reflection practice will accelerate your growth throughout our 12 weeks together. <br>
              <strong style="color: #003566;">Every Monday</strong>, you'll receive a new challenge designed specifically for your leadership development.
            </p>
          </div>

          <!-- Clean signature -->
          <div style="margin: 40px 0 0 0; padding: 24px 0; border-top: 2px solid #F5F0E8; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #4A4A4A; font-size: 16px;">Looking forward to your transformation,</p>
            <p style="margin: 0 0 4px 0; color: #003566; font-size: 20px; font-weight: 600;">Go Coach</p>
            <p style="margin: 0; color: #4A4A4A; font-size: 14px;">Your AI Leadership Coach</p>
          </div>
        </div>

        <!-- Clean Footer -->
        <div style="padding: 30px; background: #F5F0E8; text-align: center;">
          <div style="display: inline-block; padding: 8px 16px; background: #FFFFFF; border-radius: 16px; margin-bottom: 12px;">
            <p style="margin: 0; color: #003566; font-size: 14px; font-weight: 600;">
              Week 1 of 12 • Your personalized leadership journey
            </p>
          </div>
          <p style="margin: 0; color: #4A4A4A; font-size: 12px;">
            This email was sent to ${user.email}
          </p>
        </div>

        ${trackingPixel}
      </body>
      </html>
    `;
  }

  // Helper method to format analysis text with better paragraph breaks
  static formatAnalysisText(text: string): string {
    // Split long text into shorter paragraphs for better readability
    const sentences = text.split(/\.\s+/);
    const paragraphs = [];
    let currentParagraph = [];

    for (const sentence of sentences) {
      currentParagraph.push(sentence);
      // Create new paragraph every 2-3 sentences
      if (currentParagraph.length >= 2 && (sentence.length > 100 || currentParagraph.length >= 3)) {
        paragraphs.push(currentParagraph.join('. ') + (sentence.endsWith('.') ? '' : '.'));
        currentParagraph = [];
      }
    }

    // Add remaining sentences
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('. ') + (currentParagraph[currentParagraph.length - 1].endsWith('.') ? '' : '.'));
    }

    return paragraphs.map(p => `<p style="margin: 0 0 12px 0;">${p}</p>`).join('');
  }

  // Helper method to format action text with step-by-step structure
  static formatActionText(text: string): string {
    // Look for time allocations, steps, or numbered items to format better
    const lines = text.split(/\.\s+/);
    const formattedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!line.endsWith('.') && i < lines.length - 1) {
        line += '.';
      }

      // Check if line contains time allocation or step indicator
      if (line.match(/\d+\s*minutes?|\d+\s*min|step|begin|follow|conclude/i)) {
        formattedLines.push(`<div style="margin: 8px 0; padding-left: 12px; border-left: 2px solid #FFD60A;"><strong>${line}</strong></div>`);
      } else {
        formattedLines.push(`<p style="margin: 8px 0 0 0;">${line}</p>`);
      }
    }

    return formattedLines.join('');
  }

  static generateWeeklyEmail(user: User, weekNumber: number, content: WeeklyContent, emailId?: number): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    const trackingPixel = emailId ? `<img src="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/email/track/${emailId}" width="1" height="1" style="display:none;" alt="" />` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Week ${weekNumber}: Your Leadership Development Continues</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px 10px !important; }
            .content { padding: 30px 20px !important; }
            .header { padding: 30px 20px !important; }
            h1 { font-size: 28px !important; }
            h2 { font-size: 24px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F0E8; line-height: 1.6;">

        <!-- Modern, clean header -->
        <div style="background: #003566; color: #FFFFFF; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 36px; font-weight: 600; letter-spacing: 3px;">GO</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Week ${weekNumber} of 12</p>
        </div>

        <!-- Clean content area -->
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px;">
          <h2 style="color: #1A1A1A; font-size: 28px; font-weight: 600; margin: 0 0 24px 0;">
            Hello ${capitalizedName},
          </h2>

          <!-- Progress Acknowledgment -->
          <div style="background: #F5F0E8; border-left: 4px solid #003566; padding: 24px; border-radius: 8px; margin: 32px 0;">
            <h3 style="color: #003566; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">🌱 Progress Recognition</h3>
            <div style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${EmailTemplates.formatAnalysisText(content.encouragement)}
            </div>
          </div>

          <!-- This Week's Challenge -->
          <div style="background: #F5F0E8; border-left: 4px solid #FFD60A; padding: 24px; border-radius: 8px; margin: 32px 0;">
            <h3 style="color: #003566; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">🎯 This Week's Challenge</h3>
            <div style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${EmailTemplates.formatActionText(content.actionItem)}
            </div>
          </div>

          <!-- Goal Connection -->
          <div style="background: #F5F0E8; border-left: 4px solid #003566; padding: 24px; border-radius: 8px; margin: 32px 0;">
            <h3 style="color: #003566; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">🎯 Connection to Your Vision</h3>
            <div style="color: #1A1A1A; font-size: 16px; line-height: 1.6;">
              ${EmailTemplates.formatAnalysisText(content.goalConnection)}
            </div>
          </div>

          <!-- Clean signature -->
          <div style="margin: 40px 0 0 0; padding: 24px 0; border-top: 2px solid #F5F0E8; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #4A4A4A; font-size: 16px;">Continuing your growth journey,</p>
            <p style="margin: 0 0 4px 0; color: #003566; font-size: 20px; font-weight: 600;">Go Coach</p>
            <p style="margin: 0; color: #4A4A4A; font-size: 14px;">Your AI Leadership Coach</p>
          </div>
        </div>

        <!-- Clean Footer -->
        <div style="padding: 30px; background: #F5F0E8; text-align: center;">
          <div style="display: inline-block; padding: 8px 16px; background: #FFFFFF; border-radius: 16px; margin-bottom: 12px;">
            <p style="margin: 0; color: #003566; font-size: 14px; font-weight: 600;">
              Week ${weekNumber} of 12 • Your personalized leadership journey
            </p>
          </div>
          <p style="margin: 0; color: #4A4A4A; font-size: 12px;">
            This email was sent to ${user.email}
          </p>
        </div>

        ${trackingPixel}
      </body>
      </html>
    `;
  }

  static generateSubjectLine(weekNumber: number, actionItem: string): string {
    const subjects = [
      `Week ${weekNumber}: ${actionItem.split(' ').slice(0, 4).join(' ')}...`,
      `Your Week ${weekNumber} Leadership Challenge`,
      `Week ${weekNumber}: Building Your Leadership Edge`,
      `Leadership Development Week ${weekNumber}`,
    ];

    if (weekNumber === 1) return "Welcome to GO - Your Leadership Transformation Begins";
    if (weekNumber <= 3) return `Week ${weekNumber}: Building Self-Awareness`;
    if (weekNumber <= 8) return `Week ${weekNumber}: Applying Your Skills`;
    return `Week ${weekNumber}: Mastering Leadership`;
  }
}