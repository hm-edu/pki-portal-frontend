import {
    chainMatch,
    isPageRequest,
    csp,
    strictDynamic,
    strictInlineStyles,
    telemetry,
} from "@next-safe/middleware";

const DOMAIN_HOST = process.env.DOMAIN_HOST ?? process.env.NEXT_PUBLIC_DOMAIN_HOST ?? "https://domain.api.hm.edu";
const PKI_HOST = process.env.PKI_HOST ?? process.env.NEXT_PUBLIC_PKI_HOST ?? "https://pki.api.hm.edu";
const EAB_HOST = process.env.EAB_HOST ?? process.env.NEXT_PUBLIC_EAB_HOST ?? "https://eab.api.hm.edu";
const SENTRY_HOST = process.env.SENTRY_HOST ?? process.env.NEXT_PUBLIC_SENTRY_HOST ?? "https://sentry.hm.edu";

const securityMiddleware = [
    csp({
        directives:
        {
            "script-src": ["self", "data:"],
            "style-src": ["self", "data:"],
            "img-src": ["self", "data:"],
            "object-src": ["self", "data:"],
            "connect-src": [SENTRY_HOST, PKI_HOST, EAB_HOST, DOMAIN_HOST, "self"],
        },
    }),
    strictDynamic(),
    strictInlineStyles(),
];
const withTelemetry = telemetry({
    middlewares: securityMiddleware,
    profileLabel: "securityMiddleware",
});
export default chainMatch(isPageRequest)(withTelemetry);