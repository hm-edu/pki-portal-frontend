import { AccountInfo, IPublicClientApplication, AuthenticationResult } from "@azure/msal-browser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function authorize(account: AccountInfo, instance: IPublicClientApplication, scopes: string[], handler: (response: AuthenticationResult) => void, err: (error: any) => void) {
    instance.acquireTokenSilent({
        scopes: scopes,
        account: account,
    }).then(handler).catch(() => {        
        instance.acquireTokenPopup({
            scopes: scopes,
            account: account,
        }).then(handler).catch((error) => {
            err(error);
        });
    });
}