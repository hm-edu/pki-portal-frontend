import type { Configuration } from "@azure/msal-browser";
import { Config } from "../config";

export const msalConfig: Configuration = {
    auth: {
        clientId: Config.CLIENT_ID,
        authority: Config.AUTHORITY, // This is a URL (e.g. https://login.microsoftonline.com/{your tenant ID})
        redirectUri: `https://${Config.HOST}/oidc-callback`,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};