import { useMsal } from "@azure/msal-react";
import { Box, Button } from "@mui/material";
import React, { useState } from "react";
export default function Profile() {
    const { instance, accounts } = useMsal();
    const [accessToken, setAccessToken] = useState("");

    const name = accounts[0] && accounts[0].name;
    const loginRequest = {
        scopes: ["api://09a0144d-abc4-4fb4-b567-1d8495b47736/Domains.Read"],
    };
    function RequestAccessToken() {
        const request = {
            ...loginRequest,
            account: accounts[0],
        };

        // Silently acquires an access token which is then attached to a request for Microsoft Graph data
        instance.acquireTokenSilent(request).then((response) => setAccessToken(response.accessToken)).catch(() => {
            void instance.acquireTokenPopup(request).then((response) => setAccessToken(response.accessToken));
        });
    }
    return <Box>
        <h3>Details zur Anmeldung: {name} </h3>
        {accessToken ?
            <div><p>Access Token Acquired! </p>
                <code>{accessToken}</code>
            </div>
            : <Button variant="outlined" onClick={RequestAccessToken}>Request Access Token</Button>
        }
    </Box>;
}
