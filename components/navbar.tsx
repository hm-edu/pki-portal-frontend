import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import React, { useEffect, useState } from "react";
import { SignInButton } from "./signInButton";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Config } from "./config";

export default function ButtonAppBar() {
    const { data: session } = useSession();
    const idp = Config.IDP;
    const [userFragment, setFragment] = useState(<></>);

    useEffect(() => {
        setFragment(session ? <> <Tooltip title={session.user?.email as string ?? ""} arrow><Typography sx={{ paddingRight: "10px" }}>{session.user?.name as string ?? ""}</Typography></Tooltip>
            <Button color="inherit" key='logout'
                onClick={() => {
                    void signOut({ callbackUrl: idp + "/idp/profile/Logout" });
                }}
                variant="outlined">
                Abmelden
            </Button></> : <SignInButton />);
    }, [session]);

    const buttons = session ? [
        <Link key="ssl" href="/ssl" prefetch={false}><Button key="ssl" color="inherit">SSL Zertifikate</Button></Link>,
        <Link key="smime" href="/smime" prefetch={false}><Button key="smime" color="inherit" >SMIME Zertifikate</Button></Link>,
        <Link key="domains" href="/domains" prefetch={false}><Button key="domains" color="inherit" >Domainverwaltung</Button></Link>,
        <Link key="eab" href="/eab" prefetch={false}><Button key="eab" color="inherit" >EAB Tokens</Button></Link>,
    ] : [];

    return (
        <AppBar position="fixed">
            <Toolbar>
                <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography component="div" sx={{ flexGrow: 1 }}>
                    <Link href="/">
                        <Button color="inherit">Home</Button>
                    </Link>
                    {buttons}
                </Typography>
                {userFragment}
            </Toolbar>
        </AppBar>
    );
}
