Deployment readiness checklist

This project is functionally ready for staging, but the following items must be completed before releasing to real clients.

Required environment variables (production):
- `DATABASE_URL` - MySQL connection string used by Drizzle
 - `BUILT_IN_FORGE_API_KEY` - API key for the LLM provider (set in `ENV.forgeApiKey`)
- `PORT` (optional) - port to run the server on (defaults to 3000)
- `NODE_ENV=production`

Recommended environment variables:
- `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` - to silence index.html warnings and enable analytics
- `SENTRY_DSN` or other monitoring secrets

Pre-deploy checklist:
1. Run type-check and tests locally:

```bash
pnpm install
pnpm run check
pnpm test
pnpm run build
```

2. Configure production environment with the required env vars.
3. Run smoke tests against a staging deployment:
   - Sign-in flow (OAuth)
   - Create trainer and client accounts
   - Assign a program to a client
   - Client: submit check-in with photos
   - Client: use AI Exercise/Nutrition generators and verify output
4. Verify logs and monitoring (Sentry/Datadog) for errors.
5. Verify storage (S3 or storage proxy) is configured and accessible.
6. Verify Stripe webhook signing secret (if using payments) and test payments.

Health and monitoring:
- The server exposes a `/health` endpoint which returns `{ ok: true, db: boolean }`.
- The server exposes a `/health` endpoint which returns `{ ok: true, db: boolean, storage: boolean|"not_configured", llm: boolean }`.
- Configure your platform (Kubernetes, Load Balancer, or hosting) to use `/health` for readiness/liveness checks.

Sentry (optional but recommended):
- Set `SENTRY_DSN` (server) and `VITE_SENTRY_DSN` (client) to enable error reporting.
- The server will initialize Sentry if `SENTRY_DSN` is present and attach request/error handlers for automatic capture.

CI and automation:
- Add the included GitHub Actions workflow (`.github/workflows/ci.yml`) to run type-checks, tests and a production build on pull requests.

Rollout notes:
- Consider a gradual rollout to a limited client group first.
- Keep a rollback plan (previous image or tag) and database backups before major releases.

If you want, I can also:
- Add a healthcheck endpoint
- Wire analytics env docs into `index.html` or the README
- Add CI steps for automatic checks on PRs
