"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import FileDownload from "@mui/icons-material/FileDownload";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { green } from "@mui/material/colors";
import Modal from "@mui/material/Modal";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import * as Sentry from "@sentry/nextjs";
import moment from "moment";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import unidecode from "unidecode";

import { SMIMEApi } from "@/api/pki/api";
import { Configuration } from "@/api/pki/configuration";
import { Config } from "@/components/config";
import { createP12 } from "@/components/pkcs12";
import { modalTheme } from "@/components/theme";

const SMIMEGenerator = () => {

    const [progress, setProgress] = useState<React.ReactElement>(<></>);
    const [download, setDownload] = useState<React.ReactElement>(<></>);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [closed, setClosed] = useState(false);
    const [error, setError] = useState("");
    const [validation, setValidation] = useState<string | undefined>(undefined);
    const p12PasswordRef = useRef<TextFieldProps>(null);
    const p12PasswordConfirmRef = useRef<TextFieldProps>(null);

    const { data: session, status } = useSession();

    if (Config.DisableUser) {
        return <Alert severity="warning">
            <AlertTitle>Hinweis</AlertTitle>
            Der Bezug von Nutzerzertifikaten ist derzeit deaktiviert!
        </Alert>;
    }

    const buttonSx = {
        ...(success && {
            bgcolor: green[500],
            "&:hover": {
                bgcolor: green[700],
            },
        }), mb: 2,
    };
    const create = async (event: FormEvent) => {
        event.preventDefault();
        if (loading) {
            return;
        }
        setSuccess(false);
        setLoading(true);
        setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Generiere CSR...</Typography>);
        try {
            if (session && session.user.name && session.user.email) {
                const CsrBuilder = (await import("@/components/csr")).CsrBuilder;
                const csr = new CsrBuilder();
                const x = await csr.build("rsa", undefined, session.user.email, 4096);
                setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>CSR generiert...</Typography>);
                setIssuing(true);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
                const filename = `${unidecode(session.user.name).replace(" ", "_")}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.p12`;

                const cfg = new Configuration({ accessToken: session.accessToken });
                const api = new SMIMEApi(cfg, `${Config.PkiHost}`);
                setProgress(
                    <>
                        <Typography id="modal-modal-description" sx={{ mt: "24px", mb: "5px" }}>
                            Signiere CSR...
                        </Typography>
                        <Alert severity="warning">Dieser Schritt kann leider bis zu 5 Minuten dauern.</Alert>
                    </>);
                const response = await api.smimeCsrPost({ csr: x.csr });
                setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Generiere PKCS12...</Typography>);
                const certs = response.data.split(/(?=-----BEGIN CERTIFICATE-----)/g);
                const p12 = await createP12(x.privateKey, certs, p12PasswordRef.current?.value as string, "rsa");
                const element = document.createElement("a");
                element.setAttribute("href", "data:application/x-pkcs12;base64," + p12);
                element.setAttribute("download", filename);
                element.style.display = "none";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                setDownload(<Button variant="outlined" color="inherit" startIcon={<FileDownload />} download={filename} href={"data:application/x-pkcs12;base64," + p12}>Erneuter Download</Button>);
                setProgress(<Box sx={{ display: "flex", flexDirection: "column", gap: "15px", width: "md", alignItems: "left" }}>
                    <Typography id="modal-modal-description" sx={{ mt: "24px" }}>PKCS12 generiert.</Typography>
                    <Typography sx={{ mt: "5px" }}>Automatischer Download von Datei gestartet. Bitte sichern Sie die generierte Datei!</Typography>
                    <Typography sx={{ mt: "5px" }}>Ein erneuter Download nach Verlassen der Seite ist nicht möglich!</Typography>
                    <Button variant="outlined" color="inherit" sx={buttonSx} startIcon={<FileDownload />} download={filename} href={"data:application/x-pkcs12;base64," + p12}>Erneuter Download</Button>
                    <Button variant="outlined" color="inherit" onClick={(event) => { event.preventDefault(); setClosed(true); }}>Dialog schließen</Button>
                </Box>);
                setSuccess(true);
                setLoading(false);
            }
        } catch (error) {
            Sentry.captureException(error);
            setLoading(false);
            setError("Es ist ein unbekannter Fehler aufgetreten!");
        }
    };
    useEffect(() => {
        if (issuing) {
            return;
        }
        if (!success)
            setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Bitte warten...</Typography>);
        if (status == "authenticated" && !issuing) {
            Sentry.setUser({ email: session?.user?.email?? "" });
            setLoading(false);
            validate();
        } else if (status == "unauthenticated") {
            setLoading(false);
            setError("Sie sind nicht angemeldet!");
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const validate = useCallback(() => {
        if (p12PasswordRef.current?.value == "" || p12PasswordRef.current?.value == undefined) {
            setValidation("Bitte vergeben Sie ein individuelles Passwort für Ihre PKCS12-Datei.");
        } else if ((p12PasswordRef.current?.value as string).length < 6) {
            setValidation("Das Passwort muss mindestens 6 Zeichen lang sein.");
        } else if (p12PasswordConfirmRef.current?.value != undefined && p12PasswordRef.current?.value != p12PasswordConfirmRef.current?.value) {
            setValidation("Die eingegebenen Passwörter stimmen nicht überein.");
        } else {
            setValidation(undefined);
        }
    }, [p12PasswordConfirmRef, p12PasswordRef]);

    if (!error && session) {
        return <>
            <Typography variant="h1">Erstellung eines neuen Nutzerzertifikats</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "15px", width: "md", alignItems: "left" }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "left", alignSelf: "left", paddingBottom: "10px" }}>
                    <Typography variant="h2">Aktuelle Benutzerdaten:</Typography>
                    <Typography><b>Name:</b> {session.user.name}</Typography>
                    <Typography><b>E-Mail:</b> {session.user.email}</Typography>
                </Box>
                <Box component="form" onSubmit={(event) => { void create(event); }} sx={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "left", gap: "15px", alignSelf: "center" }}>
                    <Box >
                        <Typography sx={{ paddingBottom: "10px" }}>Bitte vergeben Sie ein individuelles PKCS12 Import-Passwort.</Typography>
                        <TextField required id="pkcs12" label="PKCS12 Passwort" sx={{ paddingBottom: "10px" }} type="password" inputRef={p12PasswordRef} fullWidth variant="standard" onChange={validate} />
                        <TextField required id="pkcs12validation" label="PKCS12 Passwort Bestätigung" type="password" fullWidth inputRef={p12PasswordConfirmRef} variant="standard" onChange={validate} />
                    </Box>
                    <Button id="generate" type="submit" variant="outlined" color="inherit" disabled={(loading || success) || (validation != undefined) || p12PasswordRef.current?.value == ""} sx={buttonSx}>Generiere Zertifikat {loading && (
                        <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                    )}</Button>
                    {validation && <Alert variant="filled" id="validation" severity="error">
                        <AlertTitle>Fehler!</AlertTitle>
                        {validation}
                    </Alert>}
                    {download}
                </Box>
            </Box>
            <Modal open={(loading || success) && !closed} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                <Box sx={{ ...modalTheme, width: "500px" }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Generierung eines neuen Nutzerzertifikats
                    </Typography>
                    {loading && <Box sx={{ padding: 2 }}>
                        <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                    </Box>}
                    {progress}
                </Box>
            </Modal>
        </>;
    }
    return <>
        <Typography variant="h1">Erstellung eines neuen Nutzerzertifikats</Typography><Alert sx={{ width: "100%" }} severity="error">{error}</Alert>
    </>;

};

export default SMIMEGenerator;
