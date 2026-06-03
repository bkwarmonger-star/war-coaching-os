# ✅ READY TO DEPLOY - Final Execution Checklist

**Status:** 🚀 PRODUCTION READY  
**Version:** 1.0.0-deployment (tagged)  
**Date Created:** June 3, 2026  
**Estimated Time to Production:** 90-120 minutes  

---

## 🎯 Your Deployment Path

You have everything you need. Follow these steps in order.

---

## ✅ PRE-DEPLOYMENT (Do This Now)

### 1. Gather Your Credentials (5 minutes)

You need these values **before proceeding**:

```bash
# Get these from your providers:
DATABASE_URL="mysql://username:password@host:3306/database_name"
BUILT_IN_FORGE_API_KEY="sk-your-actual-api-key"
OAUTH_SERVER_URL="https://your-oauth-server.com"
OWNER_OPEN_ID="your-owner-id"
JWT_SECRET="$(openssl rand -base64 32)"  # Generate this
VITE_APP_ID="your-app-id"

# Optional but recommended:
SENTRY_DSN="https://your-key@sentry.io/12345"
```

**⚠️ Do NOT skip this step.** The server will not start without these values.

### 2. Create Environment File (2 minutes)

```bash
# In your workspace:
cp .env.production.example .env.production

# Edit the file with your credentials:
nano .env.production
# OR
vi .env.production
# OR use your editor of choice
```

**Save the file** (Ctrl+O, Enter, Ctrl+X in nano).

### 3. Verify Local Setup (3 minutes)

```bash
# Make sure you're in the right directory:
cd /workspaces/war-coaching-os

# Check that dist/ folder exists (it should from our earlier build):
ls -la dist/ | head -5

# You should see dist/index.js and dist/public/ directories
```

---

## 🧪 LOCAL TESTING (10 minutes)

### Step 1: Build (Already done, verify it exists)

```bash
ls -la dist/index.js
# Should show: -rw-rw-r-- ... 105.2k dist/index.js
```

### Step 2: Start Docker Services

```bash
# Make sure Docker is running (you might need to start Docker Desktop)
docker --version  # Should show Docker version

# Start the services:
docker-compose up -d

# Wait for MySQL to initialize:
sleep 10

# Check status:
docker-compose ps
# Should show: war-coaching-mysql and war-coaching-app both running
```

### Step 3: Run Smoke Tests

```bash
# Run automated tests:
pnpm run test:smoke

# Or manually:
bash smoke-tests.sh http://localhost:3000

# You should see:
# ✓ Server Health
# ✓ Health Endpoint
# ✓ Tests passed
```

### Step 4: Verify Local Deployment

```bash
# Test the health endpoint:
curl http://localhost:3000/health

# Should return something like:
# {
#   "ok": true,
#   "db": true,
#   "storage": "not_configured",
#   "llm": true
# }
```

### Step 5: Cleanup Local Test

```bash
# Stop the local environment:
docker-compose down

# You should see services stopping
```

**✅ If all tests passed, you're ready for staging!**

---

## 🚀 STAGING DEPLOYMENT (30-45 minutes)

### Option A: Docker Push to Registry (Recommended)

```bash
# Build the Docker image:
docker build -t war-coaching-os:staging .

# If you have a registry (Docker Hub, ECR, GHCR, etc.):
docker tag war-coaching-os:staging your-registry/war-coaching-os:staging
docker push your-registry/war-coaching-os:staging

# On your staging server, pull and run:
docker run -d \
  --name war-coaching-staging \
  -p 3000:3000 \
  --env-file .env.production \
  your-registry/war-coaching-os:staging

# View logs:
docker logs -f war-coaching-staging
```

### Option B: Direct SSH Deploy

```bash
# Build locally:
docker build -t war-coaching-os:staging .

# Or copy the dist/ folder to staging server:
scp -r dist/ package.json pnpm-lock.yaml user@staging-server:/app/war-coaching/

# On staging server:
ssh user@staging-server
cd /app/war-coaching
pnpm install --frozen-lockfile --prod
NODE_ENV=production pnpm start
```

### Option C: Manus Platform

```bash
# Contact Manus support with:
# 1. Built /dist/ folder
# 2. .env.production settings
# 3. Staging domain name
```

---

## ✅ STAGING VALIDATION (20-30 minutes)

### Automated Tests

```bash
# From your local machine:
bash smoke-tests.sh https://staging-domain.com

# Or:
pnpm run test:smoke:staging
```

### Manual Verification Checklist

**Authentication:**
- [ ] Can navigate to `/` and see "W.A.R. COACHING" landing page
- [ ] "Login" button is visible
- [ ] Click login → redirected to OAuth provider
- [ ] Complete OAuth login → redirected back to dashboard
- [ ] Dashboard loads without errors

**Account Setup:**
- [ ] Can create or view trainer profile
- [ ] Can create client account
- [ ] Can link client to trainer
- [ ] Client can see their portal

**Core Features:**
- [ ] Can create a training program
- [ ] Can assign program to client
- [ ] Client can view assigned program
- [ ] Can submit a check-in with photo upload
- [ ] AI Exercise Generator produces output
- [ ] AI Nutrition Generator produces output

**Performance & Monitoring:**
- [ ] Health check passes: `curl https://staging-domain.com/health`
- [ ] Response times are reasonable (<1 second)
- [ ] No errors in browser console
- [ ] Sentry is logging errors (if configured)

**Database & Storage:**
- [ ] Photos upload successfully
- [ ] Can download/view uploaded photos
- [ ] Database queries are fast

### If Tests Pass
- ✅ Ready for production!

### If Tests Fail
- Check error logs: `docker logs war-coaching-staging`
- Verify env vars: `docker exec war-coaching-staging env | grep DATABASE`
- Check database connectivity
- Review `/health` endpoint response
- See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) troubleshooting section

---

## 🔥 PRODUCTION DEPLOYMENT (30-45 minutes)

### Prerequisites
- [ ] Staging tests all passed
- [ ] Team is ready
- [ ] Database backup created
- [ ] Rollback plan tested
- [ ] Monitoring (Sentry/Datadog) configured

### Deployment Steps

```bash
# Tag this version:
docker tag war-coaching-os:staging war-coaching-os:v1.0.0

# Push to production registry:
docker push your-registry/war-coaching-os:v1.0.0

# On production server:
docker run -d \
  --name war-coaching-prod \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  your-registry/war-coaching-os:v1.0.0
```

### Post-Deployment Verification

```bash
# 1. Check server is running:
curl https://your-domain.com/health

# 2. Monitor for 5 minutes:
# - Watch error logs
# - Check error rate in Sentry
# - Monitor response times
# - Verify no spike in CPU/memory

# 3. Test key user flows:
# - OAuth login
# - Create client
# - Assign program
# - Check-in upload
# - AI generators

# 4. Check monitoring dashboards
```

### If All Good
**🎉 You're live in production!**

Communicate to users that the system is updated.

### If Issues
**Rollback immediately:**

```bash
# Stop current version:
docker stop war-coaching-prod
docker rm war-coaching-prod

# Rollback to previous version:
docker run -d \
  --name war-coaching-prod \
  -p 3000:3000 \
  --env-file .env.production \
  your-registry/war-coaching-os:v1.0.0-previous

# Notify team of rollback
```

---

## 📋 Critical Checklist

Before you start, check ALL of these:

- [ ] `.env.production` file created with all credentials filled in
- [ ] Docker is installed and running
- [ ] Database is accessible and initialized
- [ ] LLM API key is valid
- [ ] OAuth credentials are correct
- [ ] You have access to your deployment platform
- [ ] You've read [DEPLOYMENT_START_HERE.md](DEPLOYMENT_START_HERE.md)
- [ ] You understand the steps above
- [ ] Team is aware of deployment window
- [ ] Rollback plan is documented

---

## 🆘 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| "Server won't start" | Check env vars: all required ones must be set |
| "Database connection failed" | Verify `DATABASE_URL` is correct |
| "Can't access staging" | Check firewall, security groups, DNS |
| "Health endpoint returns false" | Check database/LLM connectivity |
| "OAuth doesn't work" | Verify `OAUTH_SERVER_URL` and credentials |
| "Smoke tests fail" | Run manually to see specific errors |

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

---

## ⏱️ Timeline Summary

| Phase | Time | What |
|-------|------|------|
| **Setup** | 10 min | Gather credentials, create env file |
| **Local Test** | 10 min | docker-compose, smoke tests |
| **Staging Deploy** | 30 min | Build, push, deploy |
| **Staging Validation** | 30 min | Automated + manual tests |
| **Production Deploy** | 30 min | Tag, push, deploy to prod |
| **Production Validation** | 10 min | Health checks, monitoring |
| **TOTAL** | **2 hours** | Ready to serve real users |

---

## 📞 Support Resources

**If you're stuck:**

1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full reference
2. Check [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Security/monitoring
3. Check `.env.production.example` - Environment reference
4. Run `bash smoke-tests.sh <url>` - Diagnose issues
5. Check server logs: `docker logs war-coaching-prod`

---

## 🎊 Final Checklist

- [ ] Read this entire document
- [ ] Gathered all credentials
- [ ] Created `.env.production` file
- [ ] Ran local tests successfully
- [ ] Deployed to staging
- [ ] Passed staging tests
- [ ] Deployed to production
- [ ] Health endpoint returns OK
- [ ] Monitoring shows normal metrics
- [ ] **🎉 System is live!**

---

## 🚀 Next Step

**You're ready.** Start with:

```bash
# 1. Create env file:
cp .env.production.example .env.production

# 2. Edit it:
nano .env.production
# Add your credentials and save

# 3. Test locally:
docker-compose up -d && sleep 10 && pnpm run test:smoke && docker-compose down

# 4. When tests pass, deploy to staging
# 5. When staging passes, deploy to production
```

**Estimated time to production: 90-120 minutes**

---

## 📊 Success Criteria

You'll know you're successful when:

✅ Application starts without errors  
✅ Health endpoint responds with `{ "ok": true }`  
✅ Users can login via OAuth  
✅ Can create clients and programs  
✅ Can upload photos  
✅ AI generators work  
✅ Error rate is low (<0.1%)  
✅ Response times are good (<500ms p95)  
✅ Monitoring shows normal metrics  

---

**Status: Ready to Deploy** ✅  
**Version: 1.0.0-deployment**  
**Tag: https://github.com/bkwarmonger-star/war-coaching-os/releases/tag/v1.0.0-deployment**

---

*You have everything you need. Time to go live!* 🚀
