import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { SignInButton } from "./signInButton";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export default function ButtonAppBar() {
    const auth = useAuth();
    const navigation = useNavigate();

    const userFragment = (auth.isAuthenticated) ? <>
        <Tooltip title={auth.user?.profile["sub"] as string} arrow><Typography sx={{ paddingRight: "10px" }}>{auth.user?.profile["name"] as string}</Typography></Tooltip>
        <Button color="inherit" key='logout'
            onClick={() => {
                navigation("/");
                auth.signoutPopup()
                    .then(() => auth.removeUser())
                    .catch((e) => console.log(e));
            }}
            variant="outlined">
            Abmelden
        </Button>
    </> : <SignInButton />;

    const buttons = auth.isAuthenticated ? [
        <Button key="ssl" color="inherit" component={RouterLink} to="/ssl">SSL Zertifikate</Button>,
        <Button key="smime" color="inherit" component={RouterLink} to="/smime">SMIME Zertifikate</Button>,
        <Button key="domains" color="inherit" component={RouterLink} to="/domains">Domainverwaltung</Button>,
        <Button key="eab" color="inherit" component={RouterLink} to="/eab">EAB Tokens</Button>,
    ] : [];

    return (
        <AppBar position="fixed">
            <Toolbar>
                <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography component="div" sx={{ flexGrow: 1 }}>
                    <Button color="inherit" component={RouterLink} to="/">Home</Button>
                    {buttons}
                </Typography>
                {userFragment}
            </Toolbar>
        </AppBar>
    );
}
