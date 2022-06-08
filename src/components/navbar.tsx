import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { SignInButton } from "./signInButton";
import { Tooltip } from "@mui/material";

export default function ButtonAppBar() {
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const isAuthenticated = useIsAuthenticated();
    const navigation = useNavigate();

    const fragment = (isAuthenticated && account) ? <> <Tooltip title={account?.username} arrow><Typography sx={{ paddingRight: "10px" }}>{account?.name}</Typography></Tooltip>
        <Button color="inherit" key='logout' onClick={() => { navigation("/"); instance.logoutRedirect().catch(e => console.log(e)); return; }} variant="outlined">Abmelden</Button>
    </> : <SignInButton />;

    const buttons = isAuthenticated ? [
        <Button key="ssl" color="inherit" onClick={() => { navigation("/ssl"); }}>SSL Zertifikate</Button>,
        <Button key="smime" color="inherit" onClick={() => { navigation("/smime"); }}>SMIME Zertifikate</Button>,
        <Button key="domains" color="inherit" onClick={() => { navigation("/domains"); }}>Domainverwaltung</Button>,
        <Button key="eab" color="inherit" onClick={() => { navigation("/eab"); }}>EAB Tokens</Button>,
    ] : [];

    return (
        <AppBar position="fixed">
            <Toolbar>
                <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography component="div" sx={{ flexGrow: 1 }}>
                    <Button color="inherit" onClick={() => { navigation("/"); }}>Home</Button>
                    {buttons}
                </Typography>
                {fragment}
            </Toolbar>
        </AppBar>
    );
}
