import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Hidden from "@mui/material/Hidden";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

import React, { useEffect, useState } from "react";
import { SignInButton } from "./signInButton";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import logo from "../public/logo-small.png";
import Container from "@mui/system/Container";
import { Config } from "./config";

export default function ButtonAppBar() {
    const { data: session } = useSession();
    const [userFragment, setFragment] = useState(<></>);
    const [openDrawer, setDrawer] = React.useState<boolean>(false);

    useEffect(() => {
        const logout = <Button color="inherit" key='logout'
            onClick={() => {
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
                void signOut({ callbackUrl: (process.env.AUTH_IDP ?? process.env.NEXT_PUBLIC_AUTH_IDP ?? "https://sso-test.hm.edu") + "/idp/profile/Logout" });
            }}
            variant="outlined">
            Abmelden
        </Button>;
        if (session) {
            const DynamicMoment = dynamic(() => import("react-moment"));

            setFragment(<>
                <Tooltip title={<Box>
                    <Typography variant="body2">{session.user?.email ? session.user?.email : ""}</Typography>
                    <Typography variant="body2">Sitzung gültig bis: <DynamicMoment format="DD.MM.YYYY HH:mm">{new Date(session.expires)}</DynamicMoment></Typography>
                </Box>}>
                    <Typography sx={{ paddingRight: "10px" }}>{session.user?.name ? session.user?.name : ""}</Typography>
                </Tooltip>{logout}</>);
        } else {
            setFragment(<SignInButton />);
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const buttons = session ? [
        <Link legacyBehavior={true} passHref target="_blank" key="help" href={Config.DocsUrl}>
            <a target="_blank" style={{
                textDecoration: "none",
                color: "inherit",
            }}>
                <Button key="guides" color="inherit" >Anleitungen</Button>
            </a>
        </Link >,
    ] : [];
    if (session) {
        if (!Config.DisableAcme) {
            buttons.splice(0, 0, <Link legacyBehavior={true} key="user" href="/user" ><Button key="user" color="inherit" >Nutzerzertifikate</Button></Link>);
        }
        if (!Config.DisableUser) {
            buttons.splice(0, 0, <Link legacyBehavior={true} key="eab" href="/eab" ><Button key="eab" color="inherit" >ACME Tokens</Button></Link>);
        }
        if (!Config.DisableServer) {
            buttons.splice(0, 0, <Link legacyBehavior={true} key="server" href="/server" ><Button key="server" color="inherit">Serverzertifikate</Button></Link>);
        }
        if (!Config.DisableDomain) {
            buttons.splice(0, 0, <Link legacyBehavior={true} key="domains" href="/domains" ><Button key="domains" color="inherit" >Hostverwaltung</Button></Link>);
        }
    }
    return (
        <AppBar position="fixed">
            <Hidden key="desktop" mdDown>
                <Container maxWidth="xl">
                    <Toolbar key="bar" >
                        <Hidden lgDown>
                            <Image src={logo} height={36} width={36} alt="Logo"/>
                        </Hidden>
                        <Typography component="div" sx={{ ml: 1, flexGrow: 1 }}>
                            <Link legacyBehavior={true} href="/">
                                <Button color="inherit">Home</Button>
                            </Link>
                            {buttons}
                        </Typography>
                        {userFragment}
                    </Toolbar>
                </Container>
            </Hidden>
            <Hidden key="mobile" mdUp>
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
                                    return <Link legacyBehavior={true} key={x.key} href={x.props["href"]} passHref>
                                        <ListItemButton onClick={() => setDrawer(false)} component="a">
                                            <ListItemText primary={text} />
                                        </ListItemButton>
                                    </Link>;
                                    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
                                })}
                                <Divider />
                            </List>
                        </Box>
                    </Drawer>
                    <IconButton onClick={() => setDrawer(!openDrawer)} size="large" edge="start" color="inherit" aria-label="menu" sx={{ ml: 2, display: session == null ? "none" : "" }}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </Hidden>
        </AppBar >
    );
}
