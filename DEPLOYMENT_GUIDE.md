# W.A.R. Coaching OS — Deployment Guide

**Status:** Ready for staging deployment (June 3, 2026)

## Pre-Flight Checklist ✅

All technical checks passed:
- ✅ TypeScript compilation (0 errors)
- ✅ Unit tests (35/35 passing)
- ✅ Production build (successful)
- ✅ Health endpoint configured
- ✅ Environment validation setup

---

## 1. Environment Setup

### Production Environment Variables

Create a `.env.production` file with these required variables:

```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://user:password@host:3306/war_coaching_db

# OAuth / Authentication
OAUTH_SERVER_URL=<your-oauth-server>
OWNER_OPEN_ID=<your-owner-id>
JWT_SECRET=<secure-random-string>
VITE_APP_ID=<app-id>

# LLM / AI Integration
BUILT_IN_FORGE_API_URL=https://api.forge.example.com
BUILT_IN_FORGE_API_KEY=<your-api-key>

# Optional: Monitoring
SENTRY_DSN=<your-sentry-dsn>
VITE_SENTRY_DSN=<your-client-sentry-dsn>

# Optional: Analytics
VITE_ANALYTICS_ENDPOINT=<analytics-endpoint>
VITE_ANALYTICS_WEBSITE_ID=<website-id>
```

### Verify Environment

```bash
# Validate all required env vars are set
pnpm run check

# Build for production
pnpm run build

# Start server (it will validate on startup)
pnpm start
```

The server will fail fast if required env vars are missing.

---

## 2. Staging Deployment

### Option A: Docker Deployment (Recommended)

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy built artifacts
COPY dist dist/
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm@10.4.1
RUN pnpm install --frozen-lockfile --prod

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t war-coaching-os:staging .
docker run -p 3000:3000 --env-file .env.production war-coaching-os:staging
```

### Option B: Direct Node Deployment

```bash
# Build
pnpm build

# Copy to production server
scp -r dist/ package.json pnpm-lock.yaml user@staging.example.com:/app/

# On server:
cd /app
pnpm install --frozen-lockfile --prod
NODE_ENV=production pnpm start
```

### Option C: Manus Platform (Current Setup)

Contact Manus support to:
1. Create staging environment slot
2. Provide database credentials
3. Configure environment variables
4. Deploy built artifacts (contents of `/dist` folder)

---

## 3. Health Checks

The server exposes a `/health` endpoint for monitoring:

```bash
curl http://localhost:3000/health
```

Response when healthy:
```json
{
  "ok": true,
  "db": true,
  "storage": true,
  "llm": true
}
```

Configure your load balancer/orchestration platform to use:
- **Readiness probe:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds

---

## 4. Smoke Tests (Required Before Production)

Run the automated smoke test suite:

```bash
# Start server
pnpm start &

# Run smoke tests
pnpm run test:smoke
```

Manual smoke tests to verify:

### 4.1 OAuth Flow
- [ ] Navigate to login page
- [ ] Click "Login" button
- [ ] Complete OAuth authentication
- [ ] Redirect to dashboard succeeds

### 4.2 Account Creation
- [ ] Create trainer account (should auto-create on first login)
- [ ] Create client account
- [ ] Link client to trainer

### 4.3 Program Assignment
- [ ] Create training program (trainer dashboard)
- [ ] Assign program to client
- [ ] Verify client sees program in portal

### 4.4 Check-Ins
- [ ] Client submits check-in with photos
- [ ] Photos upload successfully to storage
- [ ] Trainer receives notification
- [ ] Trainer can view check-in details

### 4.5 AI Generators
- [ ] Test Exercise Generator (should generate custom program)
- [ ] Test Nutrition Generator (should generate meal plan)
- [ ] Verify output quality and format

### 4.6 Payments (if enabled)
- [ ] Test Stripe webhook configuration
- [ ] Submit test payment with card: 4242 4242 4242 4242
- [ ] Verify transaction recorded in database
- [ ] Verify webhook logs in Stripe dashboard

### 4.7 Storage
- [ ] Upload profile photo
- [ ] Upload check-in photo
- [ ] Verify S3/storage presigned URLs work
- [ ] Verify images load correctly

### 4.8 Monitoring
- [ ] Check Sentry for error logs (should be minimal)
- [ ] Verify no database connection errors
- [ ] Check response times are acceptable

---

## 5. Pre-Production Checklist

Before releasing to real clients, verify:

- [ ] All smoke tests pass
- [ ] Database has appropriate backups
- [ ] Monitoring (Sentry/Datadog) is configured and alerting
- [ ] Storage (S3) is configured with proper permissions
- [ ] OAuth credentials are production-ready
- [ ] Email notifications are configured (if applicable)
- [ ] SSL certificate is valid
- [ ] Domain DNS is pointed to production server
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Logging is centralized (CloudWatch, ELK, etc.)

---

## 6. Rollback Plan

If issues occur on production:

1. **Immediate:** Switch load balancer to previous version (blue-green deployment)
2. **Database:** Have backups available from before deployment
3. **DNS:** Can be reverted to previous IP
4. **Messaging:** Communicate status to users via status page

**Keep latest 3 successful builds tagged and ready:**
```bash
docker tag war-coaching-os:staging war-coaching-os:v1.0.1
docker push war-coaching-os:v1.0.1
```

---

## 7. Monitoring & Alerts

### Key Metrics to Track

- **Response time:** Should be <500ms p95
- **Error rate:** Should be <0.1%
- **Database connection pool:** Should be <80% utilized
- **Memory:** Should be <500MB for single instance
- **CPU:** Should be <50% under normal load

### Alert Thresholds

- [ ] Error rate >1% → page
- [ ] Response time >2s p95 → warn
- [ ] Server down (health check failed) → page
- [ ] Database unavailable → page
- [ ] Storage unavailable → warn

---

## 8. Post-Deployment

After successful production deployment:

1. **Monitor closely** for first 24 hours
2. **Review logs** for any errors or warnings
3. **Check database query performance**
4. **Verify scheduled tasks** (if any)
5. **Send release notes** to stakeholders
6. **Update status page** if applicable

---

## Support

For issues:
1. Check `/health` endpoint
2. Review server logs
3. Check database connectivity
4. Verify all environment variables
5. Escalate to platform support if needed

---

**Created:** June 3, 2026  
**Last Updated:** June 3, 2026  
**Status:** Ready for deployment
