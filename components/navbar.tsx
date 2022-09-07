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
import jwt_decode from "jwt-decode";

export default function ButtonAppBar({ idp }: { idp: string }) {
    const { data: session } = useSession();
    const [userFragment, setFragment] = useState(<></>);
    useEffect(() => {
        if (session) {
            if (session.accessToken && !session.user) {
                session.user = jwt_decode(session.accessToken);
            }
            setFragment(<>
                <Tooltip title={session.user?.email ? session.user?.email : ""} arrow>
                    <Typography sx={{ paddingRight: "10px" }}>{session.user?.name ? session.user?.name : ""}</Typography>
                </Tooltip>
                <Button color="inherit" key='logout'
                    onClick={() => {
                        void signOut({ callbackUrl: idp + "/idp/profile/Logout" });
                    }}
                    variant="outlined">
                    Abmelden
                </Button></>);
        } else {
            setFragment(<SignInButton />);
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

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
