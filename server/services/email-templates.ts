import { User } from "@shared/schema";
import { GoalAnalysis, WeeklyContent } from "./openai";

export class EmailTemplates {
  static generateWelcomeEmail(user: User, goalAnalysis: GoalAnalysis, emailId?: number): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GO - Your Leadership Transformation Begins</title>
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
      <body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f5f5f5; line-height: 1.6;">
        <div class="container" style="background-color: #f5f5f5; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header with sophisticated branding -->
            <div class="header" style="background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; font-weight: normal; letter-spacing: 2px;">GO</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; font-family: Arial, Helvetica, sans-serif;">Your Leadership Development Journey</p>
            </div>
            
            <!-- Content area -->
            <div class="content" style="padding: 40px 30px;">
              <h2 style="margin: 0 0 25px 0; font-family: Georgia, serif; font-size: 28px; color: #2c3e50; font-weight: normal;">
                Welcome to Your Leadership Transformation, ${capitalizedName}
              </h2>
              
              <p style="margin: 0 0 25px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #34495e; line-height: 1.6;">
                I've reviewed your leadership goals and I'm genuinely excited about the journey ahead.
              </p>
              
              <!-- Goal Analysis Section -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #e67e22; padding: 25px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #e67e22; font-family: Georgia, serif; font-size: 20px; font-weight: normal;">My Analysis of Your Goals</h3>
                <p style="margin: 0; color: #2c3e50; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; font-style: italic;">${goalAnalysis.feedback}</p>
              </div>

              <!-- First Action Section -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #d35400; font-family: Georgia, serif; font-size: 20px; font-weight: normal;">🎯 Your First Action</h3>
                <p style="margin: 0; color: #8b4513; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; font-weight: 500;">${goalAnalysis.firstAction}</p>
              </div>

              <p style="margin: 25px 0; color: #7f8c8d; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;">
                This self-reflection practice will accelerate your growth throughout our 12 weeks together. Each Monday, you'll receive a new challenge designed specifically for your leadership development.
              </p>

              <!-- Signature -->
              <div style="margin: 40px 0 20px 0; padding: 20px 0; border-top: 1px solid #ecf0f1;">
                <p style="margin: 0 0 5px 0; color: #2c3e50; font-family: Georgia, serif; font-size: 16px;">Looking forward to your transformation,</p>
                <p style="margin: 0; color: #3498db; font-family: Georgia, serif; font-size: 18px; font-weight: bold;">Dr. Sarah Chen</p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-style: italic;">Executive Leadership Coach</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-family: Arial, Helvetica, sans-serif; font-size: 14px; text-align: center;">
                Week 1 of 12 • Your personalized leadership journey
              </p>
              <p style="margin: 10px 0 0 0; color: #adb5bd; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center;">
                This email was sent to ${user.email}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateWeeklyEmail(user: User, weekNumber: number, content: WeeklyContent): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

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
      <body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f5f5f5; line-height: 1.6;">
        <div class="container" style="background-color: #f5f5f5; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; font-weight: normal; letter-spacing: 2px;">GO</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; font-family: Arial, Helvetica, sans-serif;">Week ${weekNumber} of 12</p>
            </div>
            
            <!-- Content area -->
            <div class="content" style="padding: 40px 30px;">
              <h2 style="margin: 0 0 25px 0; font-family: Georgia, serif; font-size: 28px; color: #2c3e50; font-weight: normal;">
                Hello ${capitalizedName},
              </h2>
              
              <!-- Progress Acknowledgment -->
              <div style="background-color: #e8f5e8; border-left: 4px solid #27ae60; padding: 25px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #27ae60; font-family: Georgia, serif; font-size: 20px; font-weight: normal;">Progress Recognition</h3>
                <p style="margin: 0; color: #2c3e50; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;">${content.encouragement}</p>
              </div>

              <!-- This Week's Challenge -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #d35400; font-family: Georgia, serif; font-size: 20px; font-weight: normal;">🎯 This Week's Challenge</h3>
                <p style="margin: 0; color: #8b4513; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; font-weight: 500;">${content.actionItem}</p>
              </div>

              <!-- Goal Connection -->
              <div style="background-color: #f0f4ff; border-left: 4px solid #3498db; padding: 25px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #3498db; font-family: Georgia, serif; font-size: 20px; font-weight: normal;">Connection to Your Vision</h3>
                <p style="margin: 0; color: #2c3e50; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; font-style: italic;">${content.goalConnection}</p>
              </div>

              <!-- Signature -->
              <div style="margin: 40px 0 20px 0; padding: 20px 0; border-top: 1px solid #ecf0f1;">
                <p style="margin: 0 0 5px 0; color: #2c3e50; font-family: Georgia, serif; font-size: 16px;">Continuing your growth journey,</p>
                <p style="margin: 0; color: #3498db; font-family: Georgia, serif; font-size: 18px; font-weight: bold;">Dr. Sarah Chen</p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-style: italic;">Executive Leadership Coach</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-family: Arial, Helvetica, sans-serif; font-size: 14px; text-align: center;">
                Week ${weekNumber} of 12 • Your personalized leadership journey
              </p>
              <p style="margin: 10px 0 0 0; color: #adb5bd; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center;">
                This email was sent to ${user.email}
              </p>
            </div>
          </div>
        </div>
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