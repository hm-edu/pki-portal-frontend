import {
    chainMatch,
    isPageRequest,
    csp,
    strictDynamic,
    strictInlineStyles,
    ChainableMiddleware,
} from "@next-safe/middleware";

import { Config } from "@/components/config";
let securityMiddleware: ChainableMiddleware[] = [];
if (process.env.NEXT_PUBLIC_DISABLE_CSP == "true") {
    console.log("CSP disabled");
} else {
    securityMiddleware = [
        csp({
            directives:
            {
                "script-src": ["self", "data:"],
                "style-src": ["self", "data:"],
                "img-src": ["self", "data:"],
                "object-src": ["self", "data:"],
                // @ts-expect-error Hosts will be set using env at build time
                "connect-src": [Config.PkiHost, Config.EabHost, Config.DomainHost, "self"],
            },
        }),
        strictDynamic(),
        strictInlineStyles(),
    ];
}
export default chainMatch(isPageRequest)(...securityMiddleware);
