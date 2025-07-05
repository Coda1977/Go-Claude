import { emailService } from '../email';
import { User } from '@shared/schema';
import { GoalAnalysis, WeeklyContent } from '../openai';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

describe('EmailService', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    goals: ['Leadership', 'Communication'],
    timezone: 'UTC',
    currentWeek: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockGoalAnalysis: GoalAnalysis = {
    feedback: 'Great goals!',
    goalActions: [
      { goal: 'Leadership', action: 'Take initiative' },
      { goal: 'Communication', action: 'Practice active listening' }
    ]
  };

  const mockWeeklyContent: WeeklyContent = {
    encouragement: 'Keep going!',
    actionItem: 'Focus on delegation',
    goalConnection: 'This helps with leadership'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'resend-123' },
        error: null
      });

      (emailService as any).resend = {
        emails: { send: mockSend }
      };

      const result = await emailService.sendWelcomeEmail(mockUser, mockGoalAnalysis, 1);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.stringContaining('Welcome'),
          from: 'GO Leadership <onboarding@resend.dev>',
          html: expect.any(String),
          tags: expect.arrayContaining([
            { name: 'type', value: 'welcome' },
            { name: 'user_id', value: '1' }
          ])
        })
      );
    });

    it('should handle email sending errors', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'API Error' }
      });

      (emailService as any).resend = {
        emails: { send: mockSend }
      };

      await expect(
        emailService.sendWelcomeEmail(mockUser, mockGoalAnalysis, 1)
      ).rejects.toThrow();
    });

    it('should skip email when RESEND_API_KEY is not set', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      const result = await emailService.sendWelcomeEmail(mockUser, mockGoalAnalysis, 1);

      expect(result).toBe(false);
      
      // Restore environment
      process.env.RESEND_API_KEY = originalKey;
    });
  });

  describe('sendWeeklyEmail', () => {
    it('should send weekly email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'resend-456' },
        error: null
      });

      (emailService as any).resend = {
        emails: { send: mockSend }
      };

      const result = await emailService.sendWeeklyEmail(
        mockUser, 
        2, 
        mockWeeklyContent, 
        'Week 2 Challenge', 
        2
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.any(String),
          from: 'GO Leadership <onboarding@resend.dev>',
          html: expect.any(String),
          tags: expect.arrayContaining([
            { name: 'type', value: 'weekly' },
            { name: 'week_number', value: '2' }
          ])
        })
      );
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'resend-test' },
        error: null
      });

      (emailService as any).resend = {
        emails: { send: mockSend }
      };

      await emailService.sendTestEmail('test@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Go Leadership - Test Email',
          from: 'GO Leadership <onboarding@resend.dev>',
          html: expect.stringContaining('Test Email'),
          tags: [{ name: 'type', value: 'test' }]
        })
      );
    });

    it('should throw error when RESEND_API_KEY is not configured', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      await expect(
        emailService.sendTestEmail('test@example.com')
      ).rejects.toThrow('RESEND_API_KEY not configured');

      // Restore environment
      process.env.RESEND_API_KEY = originalKey;
    });
  });
});