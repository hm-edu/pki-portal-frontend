import React from "react";
import Button from "@mui/material/Button";
import { useAuth } from "react-oidc-context";

/**
 * Renders a button which, when selected, will redirect the page to the login prompt
 */
export const SignInButton = () => {
    const auth = useAuth();

    return (
        <Button color="inherit" variant="outlined" onClick={() => { auth.signinRedirect({ extraQueryParams: { resource: "https://api.hmtest.de" } }).catch((e) => console.log(e)); return;}}> Anmelden</Button >
    );
};