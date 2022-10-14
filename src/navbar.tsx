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
import { Box, CircularProgress } from "@mui/material";
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
