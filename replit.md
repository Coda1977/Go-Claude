# Go Leadership App

## Overview

The Go Leadership App is a 12-week leadership development platform that delivers personalized AI-generated coaching emails to users. The system combines modern web technologies with AI-powered content generation to provide structured leadership development through weekly email coaching sessions.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL store
- **Email Service**: Resend API for transactional emails
- **Scheduling**: Node-cron for automated email processing
- **Security**: Helmet for security headers, rate limiting

### Database Architecture
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle migrations in `migrations/` directory
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Email System
- **AI Content Generation**: OpenAI GPT-4 for personalized coaching content
- **Template Engine**: Custom HTML email templates with responsive design
- **Delivery**: Resend API with webhook tracking for email events
- **Queue Management**: Custom email queue with retry logic and rate limiting

### User Management
- **Registration**: Goal-based onboarding with timezone selection
- **Progress Tracking**: 12-week program progression with current week tracking
- **Admin Dashboard**: User management and analytics interface

### AI Services
- **Goal Analysis**: Analyzes user goals and generates week 1 actions
- **Weekly Content**: Creates progressive weekly coaching content
- **Personalization**: Adapts content based on user goals and progress

### Scheduling System
- **Timezone Awareness**: Sends emails at 9 AM in user's local timezone
- **Automated Processing**: Hourly checks for eligible users
- **Retry Logic**: Failed email retry mechanism with exponential backoff

## Data Flow

1. **User Registration**: User submits goals and timezone → AI analyzes goals → Welcome email sent
2. **Weekly Processing**: Scheduler identifies users needing emails → AI generates personalized content → Email sent via Resend
3. **Progress Tracking**: Email events tracked via webhooks → User progress updated → Analytics computed
4. **Admin Monitoring**: Real-time dashboard shows user stats, email metrics, and system health

## External Dependencies

### AI & Email Services
- **OpenAI API**: GPT-4 for content generation (requires OPENAI_API_KEY)
- **Resend**: Email delivery and tracking (requires RESEND_API_KEY)

### Database & Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database (requires DATABASE_URL)
- **Node.js**: Runtime environment with ES module support

### Development Tools
- **Vite**: Development server with HMR and production builds
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access key
- `RESEND_API_KEY`: Resend email service key
- `SESSION_SECRET`: Session encryption secret

### Build Process
1. **Frontend**: Vite builds React app to `dist/public/`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `npm run db:push`

### Production Setup
- Server serves static files from `dist/public/`
- Express app handles API routes and webhooks
- Scheduler runs continuously for email automation
- Admin authentication for dashboard access

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- July 06, 2025: Fixed application startup issues
  - ✓ Resolved Winston package installation
  - ✓ Fixed Redis dependencies (switched to in-memory email queue)
  - ✓ Corrected JSX syntax errors in signup form
  - ✓ Fixed API request parameter order in signup submission

## Changelog

Changelog:
- July 05, 2025. Initial setup
- July 06, 2025. Application debugging and fixes