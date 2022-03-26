import { Alert, AlertTitle } from "@mui/material";
import React from "react";
import { AuthContextProps, useAuth } from "react-oidc-context";

/**
 * A public higher-order component to access the imperative API
 * @public
 */
export function loggedIn<P extends AuthContextProps>(
    Component: React.ComponentType<P>,
): React.ComponentType<Omit<P, keyof AuthContextProps>> {
    const displayName = `loggedIn(${Component.displayName || Component.name})`;
    const C: React.FC<Omit<P, keyof AuthContextProps>> = (props) => {
        const auth = useAuth();
        
        if (auth.isAuthenticated) {            
            return <Component {...(props as P)} {...auth} />;
        } else {
            const large = {
                fontSize: "1.2em",
                "& .MuiAlert-icon": {
                    fontSize: "1.5em",
                },
            };
            return <Alert severity="error" sx={large}> <AlertTitle style={{ fontSize: "1.2em" }}>Fehler!</AlertTitle> Sie sind nicht angemeldet! </Alert>;
        }
    };

    C.displayName = displayName;

    return C;
}