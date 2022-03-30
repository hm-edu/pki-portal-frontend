import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: String(process.env.REACT_APP_CLIENT_ID),
        authority: String(process.env.REACT_APP_AUTHORITY), // This is a URL (e.g. https://login.microsoftonline.com/{your tenant ID})
        redirectUri: "https://" + String(process.env.REACT_APP_HOST) + "/oidc-callback",
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};