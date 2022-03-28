import { Box, Button } from "@mui/material";
import React from "react";
import type { AuthContextProps } from "react-oidc-context";
import { loggedIn } from "../helper/loggedIn";
class Profile extends React.Component<AuthContextProps> {
    render() {
        const auth: AuthContextProps = this.props;
        return <Box>
            <h3>Details zur Anmeldung: </h3>

            <pre style={{ display: "inline-block", whiteSpace: "normal", maxWidth: "100%", wordBreak: "break-all", wordWrap: "break-word" }}>
                {JSON.stringify(auth.user, null, 2)}
            </pre>
            <Button variant="contained" onClick={() => { auth.signinSilent().catch((e) => console.log(e)); return; }}>Refresh</Button>
        </Box>;
    }
}

export default loggedIn(Profile);