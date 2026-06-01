import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentryClient() {
  const env = (import.meta as any).env || {};
  const dsn = env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const release = env.VITE_SENTRY_RELEASE || `${env.VITE_APP_VERSION || "dev"}+${env.VITE_COMMIT_SHA || "local"}`;

  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.03,
    release,
  });

  // Optional: attach a global error boundary or leave App-level boundaries to capture UI errors
}
