export const ENV = {
  // Auth
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",

  // LLM — OpenAI-compatible. Set LLM_API_URL to override the endpoint.
  llmApiKey: process.env.LLM_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "https://api.openai.com",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",

  // Storage — direct S3 or any S3-compatible provider (e.g. Cloudflare R2)
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "auto",
  s3BucketName: process.env.S3_BUCKET_NAME ?? "",
  awsEndpointUrl: process.env.AWS_ENDPOINT_URL ?? "", // set for R2: https://<account>.r2.cloudflarestorage.com

  // App
  appUrl: process.env.APP_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Optional — Forge/Manus proxy services (push notifications, heartbeat, etc.)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Optional — OAuth (email+password auth works without this)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  appId: process.env.VITE_APP_ID ?? "",
};
