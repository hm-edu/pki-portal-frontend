"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Container from "@mui/material/Container";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const LoggedOut = () => {
    const { status } = useSession();
    const router = useRouter();
    if (status == "authenticated") {
        void router.push("/");
        return <></>;
    } else {
        return <Container maxWidth="md" sx={{ mt: 2 }}>
            <Alert severity="warning">
                <AlertTitle>Hinweis</AlertTitle>
                Sie wurden aufgrund von Inaktivität automatisch abgemeldet
            </Alert>
        </Container>;
    }
};

export default LoggedOut;
