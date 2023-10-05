import Button from "@mui/material/Button";
import { signIn } from "next-auth/react";

/**
 * Renders a button which, when selected, will redirect the page to the login prompt
 */
export const SignInButton = () => {

    return (
        <Button color="inherit" variant="outlined" onClick={() => { void signIn("shibboleth"); }}>
            Anmelden
        </Button >
    );
};
