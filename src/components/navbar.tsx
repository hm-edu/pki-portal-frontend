import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "react-oidc-context";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function ButtonAppBar() {
    const auth = useAuth();
    const navigation = useNavigate();
    const broadcast = new BroadcastChannel("user-channel");
    React.useEffect(() => {

        broadcast.onmessage = (event) => {
            console.log("Message from SW");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access            
            if (event.data && event.data.type === "LOGOUT") {
                navigation("/");
                void auth.removeUser();
            }
        };

        // the `return` is important - addAccessTokenExpiring() returns a cleanup function
        return auth.events.addUserLoaded(() => {
            const target = sessionStorage.getItem("target");
            if (target) {
                sessionStorage.removeItem("target");
                navigation(String(target));
            } else {
                navigation("/profile");
            }

        });
    }, [auth, auth.events, navigation]);

    const fragment = auth.isAuthenticated ? [
        <Typography key="username" sx={{ mr: 2 }}>Willkommen {auth.user?.profile["displayName"]}</Typography>,
        <Button color="inherit" key='logout' onClick={() => { navigation("/"); auth.removeUser().catch((e) => console.log(e)); return; }} variant="outlined">Abmelden</Button>,
    ] : <Button color="inherit" variant="outlined" onClick={() => { auth.signinRedirect().catch((e) => console.log(e)); return; }}>Anmelden</Button>;

    return (
        <AppBar position="fixed">
            <Toolbar>
                <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography component="div" sx={{ flexGrow: 1 }}>
                    <Link to="/" ><Button color="inherit">Home</Button></Link>
                </Typography>
                {fragment}
            </Toolbar>
        </AppBar>
    );
}
