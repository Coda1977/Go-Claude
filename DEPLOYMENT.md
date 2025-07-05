# Production Deployment Guide

## Overview

This guide covers deploying the Go Leadership App to production with Redis-based email queue, structured logging, and comprehensive monitoring.

## Infrastructure Requirements

### Required Services
- **PostgreSQL**: Primary database (Neon recommended)
- **Redis**: Email queue and caching (6.0+)
- **Node.js**: Runtime environment (18.0+)
- **File Storage**: For log files (production only)

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Email Service
RESEND_API_KEY=your_resend_api_key

# AI Service
OPENAI_API_KEY=your_openai_api_key

# Security
SESSION_SECRET=your_secure_session_secret

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Infrastructure Setup

#### Database (Neon)
```bash
# Create production database
neon databases create go-leadership-prod

# Run migrations
npm run db:push
```

#### Redis Setup
```bash
# Using Redis Cloud or self-hosted
# Ensure Redis is accessible from your app server
redis-cli ping
```

### 2. Application Deployment

#### Build Application
```bash
# Install dependencies
npm ci --production=false

# Run type checking
npm run check

# Build application
npm run build

# Install production dependencies only
npm ci --production
```

#### Start Application
```bash
# Production start
NODE_ENV=production npm start

# Or with PM2 (recommended)
pm2 start dist/index.js --name go-leadership
```

### 3. Health Checks

#### Application Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600000,
  "services": {
    "database": true,
    "redis": true,
    "emailQueue": true
  }
}
```

#### System Metrics (Admin Only)
```bash
curl -H "Cookie: session=admin_session" http://localhost:5000/api/metrics
```

## Monitoring Setup

### Log Management
Logs are written to:
- **Console**: All environments
- **Files**: Production only
  - `logs/app-YYYY-MM-DD.log`: Application logs
  - `logs/error-YYYY-MM-DD.log`: Error logs only

### Health Monitoring
- **Endpoint**: `/api/health`
- **Frequency**: Every 30 seconds (internal)
- **Alerting**: Configure external monitoring to check this endpoint

### Performance Monitoring
- Request/response logging with timing
- Slow request detection (>5s)
- Memory usage monitoring
- Queue status tracking

## Security Considerations

### Admin Access
- Admin access is restricted to configured email
- Sessions expire after 24 hours
- Rate limiting applied to admin endpoints

### API Security
- Helmet.js security headers
- CORS configuration
- Content Security Policy (production)
- Request rate limiting

### Data Protection
- Session encryption
- Database connection encryption
- Redis password protection
- No secrets in logs

## Performance Optimization

### Redis Queue Configuration
```typescript
// Optimized for production
{
  concurrency: 3,           // Process 3 jobs simultaneously
  limiter: {
    max: 10,               // 10 jobs per minute
    duration: 60000
  },
  removeOnComplete: 50,     // Keep last 50 completed jobs
  removeOnFail: 100         // Keep last 100 failed jobs
}
```

### Database Optimization
- Connection pooling enabled
- Query optimization for user metrics
- Proper indexing on frequently queried fields

### Email Delivery
- Retry logic: 3 attempts with exponential backoff
- Rate limiting: 10 emails per minute
- Webhook tracking for delivery status

## Scaling Considerations

### Horizontal Scaling
- Stateless application design
- Redis-based session storage (if needed)
- Database connection pooling
- Load balancer configuration

### Queue Scaling
- Multiple worker instances supported
- Redis Cluster for high availability
- Dead letter queue for failed jobs

### Database Scaling
- Read replicas for analytics
- Connection pooling
- Query optimization

## Backup and Recovery

### Database Backups
```bash
# Automated daily backups (Neon handles this)
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Redis Backups
```bash
# Redis persistence configuration
save 900 1      # Save if at least 1 key changed in 900 seconds
save 300 10     # Save if at least 10 keys changed in 300 seconds
save 60 10000   # Save if at least 10000 keys changed in 60 seconds
```

### Log Retention
- Application logs: 14 days rotation
- Error logs: 30 days retention
- Automated cleanup of old log files

## Troubleshooting

### Common Issues

#### Queue Not Processing
```bash
# Check Redis connection
redis-cli ping

# Check queue status via API
curl http://localhost:5000/api/health

# Restart queue workers
pm2 restart go-leadership
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool status in logs
grep "database" logs/app-*.log
```

#### Memory Issues
```bash
# Check memory usage
curl http://localhost:5000/api/health | jq '.metrics.memory'

# Monitor with top/htop
top -p $(pgrep node)
```

### Log Analysis
```bash
# Search for errors
grep "ERROR" logs/app-*.log

# Check performance issues
grep "Slow request" logs/app-*.log

# Monitor email queue
grep "EMAIL QUEUE" logs/app-*.log
```

## Alerting Setup

### Recommended Alerts
1. **Application Down**: Health check fails
2. **High Error Rate**: >5% error rate
3. **Queue Backlog**: >100 pending jobs
4. **Database Issues**: Connection failures
5. **Memory Usage**: >90% memory utilization
6. **Slow Requests**: >5 second response times

### Integration Examples
- **Pingdom**: HTTP monitoring
- **DataDog**: Application performance monitoring  
- **Sentry**: Error tracking and alerting
- **PagerDuty**: Incident management

## Maintenance

### Regular Tasks
- Monitor log file sizes
- Review error rates and patterns
- Check queue processing efficiency
- Update dependencies monthly
- Review and rotate secrets quarterly

### Updates
```bash
# Update dependencies
npm audit fix

# Test in staging
npm run test:ci

# Deploy to production
npm run build && pm2 restart go-leadership
```