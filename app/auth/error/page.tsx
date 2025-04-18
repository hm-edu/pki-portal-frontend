"use client";

import Alert from "@mui/material/Alert";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthError() {

    const params = useSearchParams();

    if (params && params.has("error")) {
        return <Alert sx={{ marginTop: "20px" }} severity="error">Die Anmeldung ist aufgrund eines internen Fehlers fehlgeschlagen!</Alert>;
    }

    return <></>;
}

const AuthErrorHandler = () => {
    return (
        <Suspense>
            <AuthError />
        </Suspense>
    );
};

export default AuthErrorHandler;
