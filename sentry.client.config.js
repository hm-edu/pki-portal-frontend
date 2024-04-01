// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    tunnel: "/api/error",
    integrations: [Sentry.browserTracingIntegration()],
    tracePropagationTargets: [
        process.env.DOMAIN_HOST ?? process.env.NEXT_PUBLIC_DOMAIN_HOST,
        process.env.PKI_HOST ?? process.env.NEXT_PUBLIC_PKI_HOST,
        process.env.EAB_HOST ?? process.env.NEXT_PUBLIC_EAB_HOST,
        process.env.ACME_HOST ?? process.env.NEXT_PUBLIC_ACME_HOST,
    ],
    // ...
    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
});
