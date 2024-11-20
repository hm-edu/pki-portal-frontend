// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,

    tunnel: "/api/error",
    tracePropagationTargets: [
        process.env.DOMAIN_HOST ?? process.env.NEXT_PUBLIC_DOMAIN_HOST ?? '',
        process.env.PKI_HOST ?? process.env.NEXT_PUBLIC_PKI_HOST ?? '',
        process.env.EAB_HOST ?? process.env.NEXT_PUBLIC_EAB_HOST ?? '',
        process.env.ACME_HOST ?? process.env.NEXT_PUBLIC_ACME_HOST ?? '',
    ],
    // Add optional integrations for additional features
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});
