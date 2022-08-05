import React from "react";
import { useMsal } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import Button from "@mui/material/Button";

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
const loginRequest = {
    scopes: ["User.Read"],
};

function handleLogin(instance: IPublicClientApplication) {
    instance.loginRedirect(loginRequest).catch(e => {
        console.error(e);
    });
}

/**
 * Renders a button which, when selected, will redirect the page to the login prompt
 */
export const SignInButton = () => {
    const { instance } = useMsal();

    return (
        <Button color="inherit" variant="outlined" onClick={() => handleLogin(instance)}>Anmelden</Button>
    );
};