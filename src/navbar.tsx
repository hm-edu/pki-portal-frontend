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
import useSWR from "swr";
import { Box, CircularProgress, Divider, Drawer, Hidden, List, ListItemButton, ListItemText } from "@mui/material";
import Moment from "react-moment";

const fetcher = (args: RequestInfo | URL) => fetch(args).then(res => res.json());

function useIdp() {
    const { data, error } = useSWR("/api/idp", fetcher);

    return {
        idp: data,
        isLoading: !error && !data,
        isError: error,
    };
}

export default function ButtonAppBar() {
    const { data: session } = useSession();
    const { idp, isLoading } = useIdp();
    const [userFragment, setFragment] = useState(<></>);
    const [openDrawer, setDrawer] = React.useState<boolean>(false);

    useEffect(() => {
        const logout = isLoading ? <CircularProgress /> : <Button color="inherit" key='logout'
            onClick={() => {
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access            
                void signOut({ callbackUrl: idp.idp + "/idp/profile/Logout" });
            }}
            variant="outlined">
            Abmelden
        </Button>;
        if (session) {
            setFragment(<>
                <Tooltip title={<Box>
                    <Typography variant="body2">{session.user?.email ? session.user?.email : ""}</Typography>
                    <Typography variant="body2">Sitzung gültig bis: <Moment format="DD.MM.YYYY HH:mm">{new Date(session.expires)}</Moment></Typography>
                </Box>}>
                    <Typography sx={{ paddingRight: "10px" }}>{session.user?.name ? session.user?.name : ""}</Typography>
                </Tooltip>{logout}</>);
        } else {
            setFragment(<SignInButton />);
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name, idp]);

    const buttons = session ? [
        <Link key="ssl" href="/ssl" ><Button key="ssl" color="inherit">SSL Zertifikate</Button></Link>,
        <Link key="smime" href="/smime" ><Button key="smime" color="inherit" >SMIME Zertifikate</Button></Link>,
        <Link key="domains" href="/domains" ><Button key="domains" color="inherit" >Domainverwaltung</Button></Link>,
        <Link key="eab" href="/eab" ><Button key="eab" color="inherit" >EAB Tokens</Button></Link>,
    ] : [];

    return (
        <AppBar position="fixed">
            <Toolbar>
                <Hidden mdDown>
                    <Typography component="div" sx={{ flexGrow: 1 }}>
                        <Link href="/">
                            <Button color="inherit">Home</Button>
                        </Link>
                        {buttons}

                    </Typography>
                    {userFragment}
                </Hidden>
                <Hidden mdUp>
                    <Typography component="div" sx={{ flexGrow: 1 }}>
                        PKI-Portal
                    </Typography>
                    {userFragment}
                    <Drawer anchor="right" open={openDrawer} onClose={() => setDrawer(false)}>
                        <Box sx={{ width: 250 }}>
                            <List>
                                {buttons.map((x) => {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    return <Link href={x.props["href"]} passHref><ListItemButton onClick={() => setDrawer(false)} component="a"><ListItemText primary={(x.props["children"] as JSX.Element).props["children"]} /></ListItemButton></Link>;
                                })}
                                <Divider />
                            </List>
                        </Box>
                    </Drawer>
                    <IconButton onClick={() => setDrawer(!openDrawer)} size="large" edge="start" color="inherit" aria-label="menu" sx={{ ml: 2, display: session == null ? "none" : "" }}>
                        <MenuIcon />
                    </IconButton>
                </Hidden>

            </Toolbar>
        </AppBar >
    );
}
