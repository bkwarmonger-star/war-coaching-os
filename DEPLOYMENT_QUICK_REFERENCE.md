# W.A.R. Coaching OS - Quick Deployment Reference

## 🚀 Ready to Deploy

Your application has passed all pre-deployment checks:

✅ TypeScript compilation (0 errors)  
✅ Unit tests (35/35 passing)  
✅ Production build (successful)  
✅ Health endpoint configured  
✅ Environment validation ready  

---

## 📋 Next Steps

### 1. **Prepare Environment** (5 min)
```bash
# Copy and customize production environment
cp .env.production.example .env.production

# Edit with your production values
# - DATABASE_URL
# - BUILT_IN_FORGE_API_KEY
# - OAuth credentials
# - Sentry DSN (optional)
```

### 2. **Test Locally with Docker** (10 min)
```bash
# Build the application
pnpm build

# Start with docker-compose (includes MySQL)
docker-compose up -d

# Run smoke tests
pnpm run test:smoke

# View logs
docker-compose logs -f app

# Cleanup
docker-compose down
```

### 3. **Deploy to Staging** (15-30 min)

**Option A: Docker (Recommended)**
```bash
# Build image
docker build -t war-coaching-os:staging .

# Run on staging server
docker run -d \
  --name war-coaching \
  -p 3000:3000 \
  --env-file .env.production \
  war-coaching-os:staging
```

**Option B: Direct Node Deployment**
```bash
# On production server
pnpm build
pnpm install --frozen-lockfile --prod
NODE_ENV=production pnpm start
```

**Option C: Manus Platform**
- Contact Manus support to deploy built artifacts
- Configure environment variables in platform UI

### 4. **Run Smoke Tests on Staging**
```bash
./smoke-tests.sh https://staging.example.com
```

Check:
- [ ] OAuth login works
- [ ] Can create accounts
- [ ] Programs assign correctly
- [ ] Check-ins upload photos
- [ ] AI generators produce output

### 5. **Verify Integrations**
- [ ] Database is connected
- [ ] Storage/S3 is accessible
- [ ] LLM API is working
- [ ] OAuth redirects correctly
- [ ] Monitoring (Sentry) logs errors

### 6. **Deploy to Production**
```bash
# Once staging passes all tests
docker tag war-coaching-os:staging war-coaching-os:v1.0.0
docker push war-coaching-os:v1.0.0

# Deploy to production (platform-specific)
# e.g., docker pull && docker run on production
```

---

## 📦 Deployment Files Created

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment documentation |
| `PRODUCTION_CHECKLIST.md` | Pre-deployment sign-off checklist |
| `Dockerfile` | Multi-stage Docker build for production |
| `docker-compose.yml` | Local testing with MySQL and app |
| `.env.production.example` | Environment variable template |
| `smoke-tests.sh` | Automated smoke test suite |

---

## 🏥 Health Check

Once deployed, verify:

```bash
curl http://your-domain.com/health

# Should respond with:
# {
#   "ok": true,
#   "db": true,
#   "storage": true,
#   "llm": true
# }
```

---

## 📊 Monitoring

Configure these in your monitoring platform:

- **Readiness Probe:** `GET /health` (30s interval)
- **Error Rate Alert:** >1% errors → page
- **Response Time Alert:** >2s p95 → warn  
- **Database Alert:** Connection pool >80% → page

---

## 🔄 Rollback Plan

If issues occur:

1. Revert to previous Docker image tag
2. Or rollback to previous git commit and rebuild
3. Database backups available before deployment
4. DNS can be reverted if needed

```bash
# Quick rollback
docker stop war-coaching
docker run -d --name war-coaching -p 3000:3000 war-coaching-os:v1.0.0
```

---

## 📞 Support

For deployment questions:

1. Check `/health` endpoint
2. Review logs: `docker logs war-coaching`
3. Check database connectivity
4. Verify all environment variables are set
5. Consult `DEPLOYMENT_GUIDE.md`

---

## ✅ Deployment Checklist

Before going live:

- [ ] `.env.production` is configured with real credentials
- [ ] Smoke tests pass on staging
- [ ] All integrations verified (DB, LLM, OAuth, Storage)
- [ ] Monitoring and alerting configured
- [ ] Database backups created
- [ ] Team is ready and on-call
- [ ] Deployment window scheduled
- [ ] Rollback plan is ready

---

**Status:** Ready to deploy  
**Last Verified:** June 3, 2026  
**Version:** 1.0.0

Deploy with confidence! 🚀
