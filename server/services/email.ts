import nodemailer from "nodemailer";
import { User } from "@shared/schema";
import { GoalAnalysis, WeeklyContent } from "./openai";
import { EmailTemplates } from "./email-templates";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || process.env.EMAIL_USER_ENV_VAR || "default@email.com",
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD_ENV_VAR || "default_password",
      },
    });
  }

  async sendWelcomeEmail(user: User, goalAnalysis: GoalAnalysis, emailId?: number): Promise<boolean> {
    // Skip email sending in development if credentials not configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "default@email.com") {
      console.log(`Email sending skipped for ${user.email} - configure EMAIL_USER and EMAIL_PASSWORD to enable emails`);
      return false;
    }

    const subject = "Welcome to Your Leadership Journey";
    const html = EmailTemplates.generateWelcomeEmail(user, goalAnalysis, emailId);

    try {
      console.log(`Attempting to send welcome email to ${user.email}...`);
      
      // Verify transporter before sending
      const verified = await this.transporter.verify();
      if (!verified) {
        console.error("SMTP transporter verification failed - check email credentials");
        throw new Error("Email transporter verification failed");
      }
      
      console.log("SMTP transporter verified successfully");

      const info = await this.transporter.sendMail({
        from: `"Go Coach - GO Leadership" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject,
        html,
      });

      // Verify the message was accepted
      if (info.rejected && info.rejected.length > 0) {
        throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
      }

      console.log(`Welcome email sent successfully to ${user.email}${emailId ? ` with tracking ID ${emailId}` : ''} - Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error; // Always throw to ensure proper error handling upstream
    }
  }

  async sendWeeklyEmail(user: User, weekNumber: number, content: WeeklyContent, subject: string, emailId?: number): Promise<boolean> {
    // Skip email sending in development if credentials not configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "default@email.com") {
      console.log(`Weekly email sending skipped for ${user.email} - configure EMAIL_USER and EMAIL_PASSWORD to enable emails`);
      return false;
    }

    const html = EmailTemplates.generateWeeklyEmail(user, weekNumber, content, emailId);

    try {
      // Verify transporter before sending
      const verified = await this.transporter.verify();
      if (!verified) {
        throw new Error("Email transporter verification failed");
      }

      const info = await this.transporter.sendMail({
        from: `"Go Coach - GO Leadership" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject,
        html,
      });

      // Verify the message was accepted
      if (info.rejected && info.rejected.length > 0) {
        throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
      }

      console.log(`Week ${weekNumber} email sent successfully to ${user.email}${emailId ? ` with tracking ID ${emailId}` : ''} - Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send week ${weekNumber} email:`, error);
      throw error; // Always throw to ensure proper error handling upstream
    }
  }

  async sendTestEmail(email: string): Promise<void> {
    const subject = "Go Leadership - Test Email";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); padding: 30px; text-align: center; color: white;">
          <h1>Go Leadership Test Email</h1>
          <p>This is a test email from your Go Leadership system.</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <p>If you're receiving this email, your email system is working correctly!</p>
          <p>System status: ✅ Operational</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Go Leadership Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`Test email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send test email:", error);
      throw error;
    }
  }

  private generateWelcomeEmailHTML(user: User, goalAnalysis: GoalAnalysis): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Go Leadership</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); padding: 40px 30px; text-align: center; color: white;">
            <div style="display: inline-flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                <span style="color: white; font-size: 18px;">↗</span>
              </div>
              <span style="font-size: 24px; font-weight: bold;">Go Leadership</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2;">Welcome to Your Leadership Journey!</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${capitalizedName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              ${goalAnalysis.feedback}
            </p>
            
            <!-- Action Item Box -->
            <div style="background-color: #eff6ff; border-left: 4px solid #2563EB; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #2563EB; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Your Week 1 Action Items:</h3>
              <div style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                ${goalAnalysis.goalActions.map((ga, index) => `
                  <div style="margin-bottom: ${index < goalAnalysis.goalActions.length - 1 ? '16px' : '0'};">
                    <strong style="color: #2563EB;">${ga.goal}:</strong><br>
                    ${ga.action}
                  </div>
                `).join('')}
              </div>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
              This first step is designed to kickstart your leadership development journey. I'll check in with you next Monday with your Week 2 action item.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              You've got this! 🚀
            </p>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Your AI Leadership Coach</strong>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© 2024 Go Leadership. Transforming leaders, one week at a time.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWeeklyEmailHTML(user: User, weekNumber: number, content: WeeklyContent): string {
    const firstName = user.email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Week ${weekNumber} Leadership Challenge</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563EB, #1E40AF); padding: 40px 30px; text-align: center; color: white;">
            <div style="display: inline-flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                <span style="color: white; font-size: 18px;">↗</span>
              </div>
              <span style="font-size: 24px; font-weight: bold;">Go Leadership</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2;">Week ${weekNumber} Leadership Challenge</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${capitalizedName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              ${content.encouragement}
            </p>
            
            <!-- Action Item Box -->
            <div style="background-color: #eff6ff; border-left: 4px solid #2563EB; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #2563EB; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Your Week ${weekNumber} Action Item:</h3>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                ${content.actionItem}
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
              ${content.goalConnection}
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Keep up the excellent work! I'll be back next Monday with Week ${weekNumber + 1}.
            </p>
            
            <!-- Progress Bar -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 2px; margin: 20px 0;">
              <div style="background: linear-gradient(90deg, #10B981, #059669); height: 8px; border-radius: 6px; width: ${(weekNumber / 12) * 100}%;"></div>
            </div>
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 10px 0 30px 0;">
              Progress: Week ${weekNumber} of 12 (${Math.round((weekNumber / 12) * 100)}% complete)
            </p>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Your AI Leadership Coach</strong>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© 2024 Go Leadership. Transforming leaders, one week at a time.</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
