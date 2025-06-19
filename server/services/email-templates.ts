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
      <body style="margin: 0; padding: 0; font-family: 'Playfair Display', Georgia, serif; background-color: #f9f7f3; line-height: 1.65;">
        <div class="container" style="background-color: #f9f7f3; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(139, 69, 19, 0.08); overflow: hidden; border: 1px solid #f0ebe5;">
            
            <!-- Header with warm, sophisticated branding -->
            <div class="header" style="background: linear-gradient(135deg, #8b4513 0%, #d2b48c 50%, #f4e5d3 100%); color: #2c1810; padding: 50px 30px; text-align: center; position: relative;">
              <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 20px; display: inline-block;">
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 600; letter-spacing: 3px; color: #8b4513;">GO</h1>
                <div style="width: 40px; height: 2px; background: #d2b48c; margin: 8px auto;"></div>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #6b4e3d; font-family: 'Inter', Arial, sans-serif; font-weight: 400; letter-spacing: 0.5px;">Your Leadership Development Journey</p>
              </div>
            </div>
            
            <!-- Content area -->
            <div class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 30px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #2c1810; font-weight: 600; line-height: 1.2;">
                Welcome to Your Leadership Transformation, ${capitalizedName}
              </h2>
              
              <p style="margin: 0 0 35px 0; font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #5d4037; line-height: 1.65; font-weight: 400;">
                I've carefully reviewed your leadership goals and I'm genuinely excited about the transformative journey ahead of us.
              </p>
              
              <!-- Goal Analysis Section with improved readability -->
              <div style="background: linear-gradient(135deg, #faf8f5 0%, #f5f1eb 100%); border-left: 5px solid #d2b48c; padding: 35px; margin: 40px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(139, 69, 19, 0.05);">
                <h3 style="margin: 0 0 20px 0; color: #8b4513; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600;">✨ My Analysis of Your Goals</h3>
                <div style="color: #4a4a4a; font-family: 'Inter', Arial, sans-serif; font-size: 17px; line-height: 1.7;">
                  ${EmailTemplates.formatAnalysisText(goalAnalysis.feedback)}
                </div>
              </div>

              <!-- Visual break with decorative element -->
              <div style="text-align: center; margin: 45px 0;">
                <div style="display: inline-block; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d2b48c, transparent);"></div>
                <div style="display: inline-block; width: 8px; height: 8px; background: #d2b48c; border-radius: 50%; margin: 0 15px; position: relative; top: -4px;"></div>
                <div style="display: inline-block; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d2b48c, transparent);"></div>
              </div>

              <!-- First Action Section with enhanced design -->
              <div style="background: linear-gradient(135deg, #fff8f0 0%, #fef5eb 100%); border: 2px solid #f4d03f; padding: 35px; border-radius: 12px; margin: 40px 0; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #f39c12, #f4d03f, #f39c12);"></div>
                <h3 style="margin: 0 0 20px 0; color: #d35400; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600;">🎯 Your First Action</h3>
                <div style="color: #7d4f10; font-family: 'Inter', Arial, sans-serif; font-size: 17px; line-height: 1.7; font-weight: 500;">
                  ${EmailTemplates.formatActionText(goalAnalysis.firstAction)}
                </div>
              </div>

              <!-- Journey continuation message -->
              <div style="background: #f8f6f3; padding: 25px; border-radius: 8px; margin: 35px 0; text-align: center;">
                <p style="margin: 0; color: #6b4e3d; font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 1.6; font-style: italic;">
                  This self-reflection practice will accelerate your growth throughout our 12 weeks together. <br>
                  <strong style="color: #8b4513;">Every Monday</strong>, you'll receive a new challenge designed specifically for your leadership development.
                </p>
              </div>

              <!-- Enhanced signature -->
              <div style="margin: 50px 0 30px 0; padding: 30px 0; border-top: 2px solid #f0ebe5; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #5d4037; font-family: 'Inter', Arial, sans-serif; font-size: 17px; font-weight: 400;">Looking forward to your transformation,</p>
                <p style="margin: 0 0 5px 0; color: #8b4513; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 600;">Go Coach</p>
                <p style="margin: 0; color: #a0826d; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-style: italic;">Your AI Leadership Coach</p>
              </div>
            </div>
            
            <!-- Enhanced Footer -->
            <div style="padding: 40px 30px; background: linear-gradient(135deg, #f8f6f3 0%, #f2ede7 100%); border-top: 1px solid #e8ddd4;">
              <div style="text-align: center;">
                <div style="display: inline-block; padding: 12px 24px; background: rgba(139, 69, 19, 0.1); border-radius: 20px; margin-bottom: 15px;">
                  <p style="margin: 0; color: #8b4513; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600;">
                    Week 1 of 12 • Your personalized leadership journey
                  </p>
                </div>
                <p style="margin: 0; color: #a0826d; font-family: 'Inter', Arial, sans-serif; font-size: 12px;">
                  This email was sent to ${user.email}
                </p>
              </div>
            </div>
          </div>
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
    
    return paragraphs.map(p => `<p style="margin: 0 0 15px 0;">${p}</p>`).join('');
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
        formattedLines.push(`<div style="margin: 8px 0; padding-left: 15px; border-left: 3px solid #f4d03f;"><strong>${line}</strong></div>`);
      } else {
        formattedLines.push(`<p style="margin: 8px 0 0 0;">${line}</p>`);
      }
    }
    
    return formattedLines.join('');
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
      <body style="margin: 0; padding: 0; font-family: 'Playfair Display', Georgia, serif; background-color: #f9f7f3; line-height: 1.65;">
        <div class="container" style="background-color: #f9f7f3; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(139, 69, 19, 0.08); overflow: hidden; border: 1px solid #f0ebe5;">
            
            <!-- Header with warm design -->
            <div class="header" style="background: linear-gradient(135deg, #8b4513 0%, #d2b48c 50%, #f4e5d3 100%); color: #2c1810; padding: 50px 30px; text-align: center; position: relative;">
              <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 20px; display: inline-block;">
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 600; letter-spacing: 3px; color: #8b4513;">GO</h1>
                <div style="width: 40px; height: 2px; background: #d2b48c; margin: 8px auto;"></div>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #6b4e3d; font-family: 'Inter', Arial, sans-serif; font-weight: 400; letter-spacing: 0.5px;">Week ${weekNumber} of 12</p>
              </div>
            </div>
            
            <!-- Content area -->
            <div class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 30px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #2c1810; font-weight: 600; line-height: 1.2;">
                Hello ${capitalizedName},
              </h2>
              
              <!-- Progress Acknowledgment -->
              <div style="background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%); border-left: 5px solid #27ae60; padding: 35px; margin: 40px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(39, 174, 96, 0.05);">
                <h3 style="margin: 0 0 20px 0; color: #27ae60; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600;">🌱 Progress Recognition</h3>
                <div style="color: #4a4a4a; font-family: 'Inter', Arial, sans-serif; font-size: 17px; line-height: 1.7;">
                  ${EmailTemplates.formatAnalysisText(content.encouragement)}
                </div>
              </div>

              <!-- Visual break -->
              <div style="text-align: center; margin: 45px 0;">
                <div style="display: inline-block; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d2b48c, transparent);"></div>
                <div style="display: inline-block; width: 8px; height: 8px; background: #d2b48c; border-radius: 50%; margin: 0 15px; position: relative; top: -4px;"></div>
                <div style="display: inline-block; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d2b48c, transparent);"></div>
              </div>

              <!-- This Week's Challenge -->
              <div style="background: linear-gradient(135deg, #fff8f0 0%, #fef5eb 100%); border: 2px solid #f4d03f; padding: 35px; border-radius: 12px; margin: 40px 0; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #f39c12, #f4d03f, #f39c12);"></div>
                <h3 style="margin: 0 0 20px 0; color: #d35400; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600;">🎯 This Week's Challenge</h3>
                <div style="color: #7d4f10; font-family: 'Inter', Arial, sans-serif; font-size: 17px; line-height: 1.7; font-weight: 500;">
                  ${EmailTemplates.formatActionText(content.actionItem)}
                </div>
              </div>

              <!-- Goal Connection -->
              <div style="background: linear-gradient(135deg, #f0f4ff 0%, #e6f3ff 100%); border-left: 5px solid #3498db; padding: 35px; margin: 40px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.05);">
                <h3 style="margin: 0 0 20px 0; color: #3498db; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600;">🎯 Connection to Your Vision</h3>
                <div style="color: #4a4a4a; font-family: 'Inter', Arial, sans-serif; font-size: 17px; line-height: 1.7; font-style: italic;">
                  ${EmailTemplates.formatAnalysisText(content.goalConnection)}
                </div>
              </div>

              <!-- Enhanced signature -->
              <div style="margin: 50px 0 30px 0; padding: 30px 0; border-top: 2px solid #f0ebe5; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #5d4037; font-family: 'Inter', Arial, sans-serif; font-size: 17px; font-weight: 400;">Continuing your growth journey,</p>
                <p style="margin: 0 0 5px 0; color: #8b4513; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 600;">Go Coach</p>
                <p style="margin: 0; color: #a0826d; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-style: italic;">Your AI Leadership Coach</p>
              </div>
            </div>
            
            <!-- Enhanced Footer -->
            <div style="padding: 40px 30px; background: linear-gradient(135deg, #f8f6f3 0%, #f2ede7 100%); border-top: 1px solid #e8ddd4;">
              <div style="text-align: center;">
                <div style="display: inline-block; padding: 12px 24px; background: rgba(139, 69, 19, 0.1); border-radius: 20px; margin-bottom: 15px;">
                  <p style="margin: 0; color: #8b4513; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600;">
                    Week ${weekNumber} of 12 • Your personalized leadership journey
                  </p>
                </div>
                <p style="margin: 0; color: #a0826d; font-family: 'Inter', Arial, sans-serif; font-size: 12px;">
                  This email was sent to ${user.email}
                </p>
              </div>
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