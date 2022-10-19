import Alert from "@mui/material/Alert";
import { useRouter } from "next/router";

export default function SignIn() {

    const router = useRouter();

    if (router.query.error) {
        return <Alert sx={{ marginTop: "20px" }} severity="error">Die Anmeldung ist aufgrund eines internen Fehlers fehlgeschlagen!</Alert>;
    }

    return <></>;
}