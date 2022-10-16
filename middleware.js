import {
    chainMatch,
    isPageRequest,
    csp,
    strictDynamic,
    strictInlineStyles,
    telemetry,
} from "@next-safe/middleware";

const securityMiddleware = [
    csp({
        directives:
        {
            "script-src": ["self", "data:"],
            "style-src": ["self", "data:"],
            "connect-src": ["https://eab.api.hm.edu", "https://pki.api.hm.edu", "https://domain.api.hm.edu", "self"],
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