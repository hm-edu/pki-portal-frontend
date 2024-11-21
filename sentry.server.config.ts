// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    beforeSend(event, hint) {
        if (event.request && event.request.headers) {
            var ua = event.request.headers['User-Agent']
            // check if user-agent is set and contains
            if (ua && ua.includes('kube-probe')) {
                // Drop the event if the user-agent contains 'kube-probe'
                return null;
            }
        }

        return event
    }
});
