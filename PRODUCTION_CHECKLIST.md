# Production Deployment Checklist

**Date Created:** June 3, 2026  
**Project:** W.A.R. Coaching OS  
**Version:** 1.0.0

---

## Pre-Deployment Verification

### Technical Checks ✅
- [x] TypeScript compilation passes (`pnpm run check`)
- [x] All unit tests pass (`pnpm test`)
- [x] Production build succeeds (`pnpm build`)
- [x] Landing page renders correctly
- [x] Health endpoint is functional
- [x] Environment variable validation is working
- [x] Docker build succeeds (if using Docker)

### Code Quality
- [x] No TypeScript errors
- [x] No console errors in browser
- [x] No database migration issues
- [x] API endpoints working
- [x] Error handling is comprehensive

---

## Infrastructure Setup

### Database
- [ ] MySQL database created and accessible
- [ ] Migrations applied successfully
- [ ] Database backups configured
- [ ] Connection pooling configured (recommended: 10-20 connections)
- [ ] Read replicas setup (if needed for scale)

### Authentication
- [ ] OAuth server configured
- [ ] OAuth credentials validated
- [ ] JWT secret is secure and strong
- [ ] Owner OpenID is correct
- [ ] CORS is properly configured for OAuth redirects

### LLM / AI Services
- [ ] Forge API endpoint verified
- [ ] Forge API key is valid and not expired
- [ ] LLM service health check passes
- [ ] Rate limits are understood
- [ ] Fallback strategy documented (if API fails)

### Storage
- [ ] S3 bucket (or storage proxy) is accessible
- [ ] Bucket permissions are correct (read/write)
- [ ] CORS is configured for client uploads
- [ ] Presigned URL generation works
- [ ] Backup strategy for stored files is in place

---

## Monitoring & Observability

### Error Tracking
- [ ] Sentry is configured (optional but recommended)
- [ ] Sentry DSN is set for both server and client
- [ ] Error alerts are configured
- [ ] Sentry dashboard is accessible to team

### Logging
- [ ] Application logs are being collected
- [ ] Logs are searchable (CloudWatch, ELK, etc.)
- [ ] Log retention policy is set (recommended: 30 days)
- [ ] Critical logs trigger alerts

### Performance Monitoring
- [ ] APM (Application Performance Monitoring) is configured
- [ ] Response time baseline is established
- [ ] Database query performance is monitored
- [ ] Slow query alerts are configured

### Health Checks
- [ ] `/health` endpoint is monitored
- [ ] Health checks fail fast when dependencies are down
- [ ] Load balancer uses health checks for routing
- [ ] Alerting is configured for health check failures

---

## Security

### Secrets Management
- [ ] All secrets are stored in secure vault (not in code)
- [ ] API keys are rotated at least annually
- [ ] Production credentials are different from staging
- [ ] Nobody has access to all secrets (principle of least privilege)
- [ ] Secret rotation process is documented

### Network Security
- [ ] HTTPS/TLS is enforced (no HTTP in production)
- [ ] SSL certificate is valid and not self-signed
- [ ] Certificate renewal is automated
- [ ] Firewall rules limit access to only necessary ports
- [ ] VPN/IP whitelisting is configured if needed

### Application Security
- [ ] CORS is properly configured (not `*`)
- [ ] CSRF protection is enabled (if applicable)
- [ ] Rate limiting is configured
- [ ] Input validation is in place
- [ ] SQL injection is prevented (using parameterized queries)
- [ ] XSS is prevented (CSP headers, sanitization)

---

## Testing & Validation

### Smoke Tests ✅
- [x] Server starts without errors
- [x] Health endpoint responds
- [x] Database connection works
- [x] LLM API is reachable

### Manual Smoke Tests
- [ ] OAuth login flow works
- [ ] Can create trainer account
- [ ] Can create client account
- [ ] Can create training program
- [ ] Can assign program to client
- [ ] Client can view program in portal
- [ ] Client can submit check-in with photos
- [ ] Photos upload successfully
- [ ] AI Exercise Generator works
- [ ] AI Nutrition Generator works
- [ ] Trainer dashboard loads all data correctly

### Load Testing
- [ ] Basic load test conducted (if expecting >100 concurrent users)
- [ ] Response times are acceptable under load
- [ ] No memory leaks detected
- [ ] Database connection pool doesn't exceed limits

---

## Deployment

### Pre-Deployment
- [ ] Deployment runbook is reviewed by 2+ team members
- [ ] Rollback plan is documented and tested
- [ ] Database backups are created
- [ ] Previous version is tagged and saved
- [ ] Status page is prepared with deployment notice

### Deployment Execution
- [ ] Code is deployed to staging first (if possible)
- [ ] Staging tests pass
- [ ] Deployment window is scheduled
- [ ] Team is on-call and ready
- [ ] Deployment automated or carefully scripted
- [ ] Deployment logs are captured

### Post-Deployment
- [ ] All smoke tests pass on production
- [ ] Monitoring dashboards show normal metrics
- [ ] No increase in error rate
- [ ] Response times are normal
- [ ] Database queries are performing well
- [ ] Sentry error count is minimal
- [ ] Team confirms successful deployment
- [ ] Status page is updated

---

## Performance Targets

Establish these baselines and monitor:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time (p95) | <500ms | >2000ms |
| Error Rate | <0.1% | >1% |
| Database Latency | <50ms | >200ms |
| Memory Usage | <500MB | >800MB |
| CPU Usage | <50% | >80% |
| API Availability | 99.9% | <99.5% |

---

## Post-Deployment (First 24 Hours)

### Monitoring
- [ ] Error rate is normal (<0.1%)
- [ ] Response times are normal
- [ ] Database is performing well
- [ ] All integrations are working
- [ ] No unusual traffic patterns

### User Feedback
- [ ] No critical user-reported issues
- [ ] Performance is acceptable
- [ ] Features are working as expected
- [ ] No authentication issues

### Documentation
- [ ] Deployment is documented
- [ ] Issues encountered are documented
- [ ] Resolutions are documented
- [ ] Lessons learned are captured

---

## Long-Term Maintenance

### Regular Tasks
- [ ] Database maintenance scheduled (indexes, vacuums, etc.)
- [ ] Log rotation and archival setup
- [ ] Certificate renewal automation
- [ ] Dependency updates planned
- [ ] Security patches applied promptly

### Monitoring Continuation
- [ ] Dashboards are maintained
- [ ] Alerts are tuned and effective
- [ ] Performance trends are reviewed monthly
- [ ] Capacity planning is done quarterly

---

## Sign-Off

**Deployer:** _________________________ **Date:** _____________

**Reviewer:** _________________________ **Date:** _____________

**Manager:** _________________________ **Date:** _____________

---

## Post-Deployment Review

**Deployment Date:** _____________  
**Any Issues:** YES / NO

If yes, describe:
```


```

**Resolution Time:** _____________

**Go/No-Go Decision:** _____________

**Approved For Production:** YES / NO

---

**Questions or Issues?** Contact the development team or escalate to on-call support.
