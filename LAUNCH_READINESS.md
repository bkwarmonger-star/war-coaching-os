# Launch Readiness

## Required env vars (server won't start without these)

| Variable | How to get it |
|---|---|
| `DATABASE_URL` | From your MySQL host (e.g. PlanetScale, Railway, Render) |
| `JWT_SECRET` | `openssl rand -base64 64` |
| `LLM_API_KEY` | OpenAI API key — used for AI exercise/nutrition generators |
| `AWS_ACCESS_KEY_ID` | IAM user with S3 PutObject/GetObject on your bucket |
| `AWS_SECRET_ACCESS_KEY` | Same IAM user |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET_NAME` | Your S3 bucket name |

## Optional / post-deploy vars

| Variable | Notes |
|---|---|
| `OAUTH_SERVER_URL` | Leave blank — email+password auth works without it |
| `OWNER_OPEN_ID` | Set to `local:youremail@example.com` after your first signup |
| `BUILT_IN_FORGE_API_KEY` | Unused except one internal admin route — skip it |
| `STRIPE_SECRET_KEY` | Add after deploy once you have your live Stripe keys |
| `STRIPE_WEBHOOK_SECRET` | Add after deploy — requires your live URL to generate |

## Deploy steps

```bash
# 1. Provision a MySQL database, copy the connection string
# 2. Create an S3 bucket, create an IAM user with this policy:
#    {
#      "Version": "2012-10-17",
#      "Statement": [{
#        "Effect": "Allow",
#        "Action": ["s3:PutObject", "s3:GetObject"],
#        "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
#      }]
#    }
# 3. Set S3 bucket CORS to allow PUT from your domain:
#    [{"AllowedHeaders":["*"],"AllowedMethods":["PUT","GET"],
#      "AllowedOrigins":["https://yourdomain.com"],"ExposeHeaders":[]}]
# 4. Copy .env.production.example → .env.production, fill required vars
# 5. Run migrations
pnpm exec drizzle-kit migrate

# 6. Build and start
pnpm build
pnpm start

# 7. Verify
bash smoke-tests.sh
```

## After first deploy

1. Sign up for your trainer account
2. Set `OWNER_OPEN_ID=local:youremail@example.com` and restart
3. Go to Stripe → Webhooks → add your live URL → copy signing secret → set `STRIPE_WEBHOOK_SECRET`

## Bundle notes

- Client JS is code-split by route via `React.lazy()` — initial load only fetches auth pages
- Heavy pages (Analytics, AI Coach, Revenue) load on first navigation to that route
- Run `pnpm build` and check Vite output — each chunk should be well under 500 KB
