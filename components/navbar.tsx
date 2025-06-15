"use client";

import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMediaQuery } from "@mui/system";
import Container from "@mui/system/Container";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import React, { JSX, useEffect, useState } from "react";

import logo from "../public/logo-small.png";

import { Config } from "@/components/config";
import { SignInButton } from "@/components/signInButton";

export default function ButtonAppBar() {
    const { data: session } = useSession();
    const theme = useTheme();
    const [userFragment, setFragment] = useState(<></>);
    const [openDrawer, setDrawer] = React.useState<boolean>(false);
    const [buttons, setButtons] = useState<JSX.Element[]>([]);
    const desktop = useMediaQuery(theme.breakpoints.up("md"));
    const largeDesktop = useMediaQuery(theme.breakpoints.up("lg"));

    useEffect(() => {
        if (session) {
            const DynamicMoment = dynamic(() => import("react-moment"));

            const logout = <Button color="inherit" key='logout'
                onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
                    void signOut({ callbackUrl: (process.env.AUTH_IDP ?? process.env.NEXT_PUBLIC_AUTH_IDP ?? "https://sso-test.hm.edu") + (Config.AuthProvider == "shibboleth" ? "/idp/profile/Logout" : "/protocol/openid-connect/logout") });
                }}
                variant="outlined">
                Abmelden
            </Button>;
            setFragment(<>
                <Tooltip title={<Box>
                    <Typography variant="body2">{session.user?.email ? session.user?.email : ""}</Typography>
                    <Typography variant="body2">Sitzung gültig bis: <DynamicMoment format="DD.MM.YYYY HH:mm">{new Date(session.expires)}</DynamicMoment></Typography>
                </Box>}>
                    <Typography sx={{ paddingRight: "10px" }}>{session.user?.name ? session.user?.name : ""}</Typography>
                </Tooltip>{logout}</>);

            const navbarButtons: React.ReactElement[] = [];
            navbarButtons.splice(0, 0, <Link passHref target="_blank" key="help" href={Config.DocsUrl}><Button key="guides" color="inherit" >Anleitungen</Button></Link >);
            if (!Config.DisableUser) {
                navbarButtons.splice(0, 0, <Link key="user" href="/user" ><Button key="user" color="inherit" >Nutzerzertifikate</Button></Link>);
            }
            if (!Config.DisableAcme) {
                navbarButtons.splice(0, 0, <Link key="eab" href="/eab" ><Button key="eab" color="inherit" >ACME Tokens</Button></Link>);
            }
            if (!Config.DisableServer) {
                navbarButtons.splice(0, 0, <Link key="server" href="/server" ><Button key="server" color="inherit">Serverzertifikate</Button></Link>);
            }
            if (!Config.DisableDomain) {
                navbarButtons.splice(0, 0, <Link key="domains" href="/domains" ><Button key="domains" color="inherit" >Hostverwaltung</Button></Link>);
            }
            setButtons(navbarButtons);
        } else {
            setFragment(<SignInButton />);
            setButtons([]);
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    return (
        <AppBar position="fixed">
            {desktop ?
                <Container maxWidth="xl">
                    <Toolbar key="bar" >
                        {largeDesktop ? <Image src={logo} height={36} width={36} alt="Logo" /> : <></>}

                        <Typography component="div" sx={{ ml: 1, flexGrow: 1 }}>
                            <Link href="/">
                                <Button color="inherit">Home</Button>
                            </Link>
                            {buttons}
                        </Typography>
                        {userFragment}
                    </Toolbar>
                </Container> :
                <Toolbar key="bar-mobile">
                    <Typography component="div" sx={{ flexGrow: 1 }}>
                        PKI-Portal
                    </Typography>
                    {userFragment}
                    <Drawer anchor="right" open={openDrawer} onClose={() => setDrawer(false)}>
                        <Box sx={{ width: 250 }}>
                            <List>
                                {buttons.map((x) => {
                                    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                                    let text = (x.props["children"] as JSX.Element).props["children"];
                                    if (typeof text !== "string") {
                                        if (text["props"] != null && text["props"]["children"] != null && typeof text["props"]["children"] === "string") {
                                            text = text["props"]["children"];
                                        }
                                    }
                                    return <ListItemButton key={x.key} href={x.props["href"]} onClick={() => setDrawer(false)} >
                                        <ListItemText sx={{ textDecoration: "none" }} primary={text} />
                                    </ListItemButton>;
                                    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
                                })}
                                <Divider />
                            </List>
                        </Box>
                    </Drawer>
                    <IconButton onClick={() => setDrawer(!openDrawer)} size="large" edge="start" color="inherit" aria-label="menu" sx={{ ml: 2, display: session == null ? "none" : "" }}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>}
        </AppBar >
    );
}
