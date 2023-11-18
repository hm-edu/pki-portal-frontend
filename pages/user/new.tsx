/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import FileDownload from "@mui/icons-material/FileDownload";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { green } from "@mui/material/colors";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import * as Sentry from "@sentry/nextjs";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SMIMEApi } from "@/api/pki/api";
import { Configuration } from "@/api/pki/configuration";
import { Config } from "@/components/config";
import { modalTheme } from "@/components/theme";
import AlertTitle from "@mui/material/AlertTitle";
import { useSession } from "next-auth/react";
import unidecode from "unidecode";
import moment from "moment";
import { createP12 } from "@/components/pkcs12";

export default function SMIMEGenerator() {

    const [progress, setProgress] = useState<JSX.Element>(<></>);
    const [download, setDownload] = useState<JSX.Element>(<></>);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [closed, setClosed] = useState(false);
    const [warning, setWarning] = useState(false);
    const [error, setError] = useState("");
    const [validation, setValidation] = useState<string | undefined>(undefined);
    const p12PasswordRef = useRef<TextFieldProps>(null);
    const p12PasswordConfirmRef = useRef<TextFieldProps>(null);
    const revokeRef = useRef<HTMLInputElement>(null);

    const { data: session, status } = useSession();

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
        if (!loading) {
            setSuccess(false);
            setLoading(true);
            setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Generiere CSR...</Typography>);
            const CsrBuilder = (await import("@/components/csr")).CsrBuilder;
            const csr = new CsrBuilder();
            csr.build("rsa", undefined, undefined, 4096).then((x) => {
                setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>CSR generiert...</Typography>);
                setIssuing(true);
                if (session && session.user.name) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
                    const filename = `${unidecode(session.user.name).replace(" ", "_")}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.p12`;

                    const cfg = new Configuration({ accessToken: session.accessToken });
                    const api = new SMIMEApi(cfg, `${Config.PkiHost}`);
                    setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px", mb: "5px" }}>Signiere CSR...
                        <Alert severity="warning">Dieser Schritt kann leider bis zu 5 Minuten dauern.</Alert>
                    </Typography>);
                    return api.smimeCsrPost({ csr: x.csr }).then((response) => {
                        setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Generiere PKCS12...</Typography>);
                        return createP12(x.privateKey, [response.data], p12PasswordRef.current?.value as string, "rsa").then((p12) => {
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
                        }).catch((err) => {
                            console.log(err);
                            setLoading(false);
                            setError("Es ist ein unbekannter Fehler aufgetreten!");
                        });
                    }).catch((error) => {
                        console.error(error);
                        setLoading(false);
                        setError("Es ist ein unbekannter Fehler aufgetreten!");
                    });

                }
                return Promise.resolve();
            }).catch((error) => {
                Sentry.captureException(error);
                setLoading(false);
                setError("Es ist ein unbekannter Fehler aufgetreten!");
            });
        }
    };
    useEffect(() => {
        if (issuing) {
            return;
        }
        if (!success)
            setProgress(<Typography id="modal-modal-description" sx={{ mt: "24px" }}>Bitte warten...</Typography>);
        if (status == "authenticated" && !issuing) {
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SMIMEApi(cfg, `${Config.PkiHost}`);
            api.smimeGet().then((response) => {
                if (response && response != null && response.data != null) {
                    let active = 0;
                    for (const cert of response.data) {
                        if (cert.status != "revoked") {
                            active++;
                        }
                    }
                    if (active >= 5) {
                        setWarning(true);
                    }
                }
                setLoading(false);
                validate();
            }).catch((error) => {
                Sentry.captureException(error);
                setLoading(false);
                setError("Es ist ein unbekannter Fehler aufgetreten!");
            });
        } else if (status == "unauthenticated") {
            setLoading(false);
            setError("Sie sind nicht angemeldet!");
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const validate = useCallback(() => {
        if (p12PasswordRef.current?.value == "") {
            setValidation("Bitte vergeben Sie ein individuelles Passwort für Ihre PKCS12-Datei.");
        } else if ((p12PasswordRef.current?.value as string).length < 6) {
            setValidation("Das Passwort muss mindestens 6 Zeichen lang sein.");
        } else if (p12PasswordRef.current?.value != p12PasswordConfirmRef.current?.value) {
            setValidation("Die eingegebenen Passwörter stimmen nicht überein.");
        } else if (warning && !revokeRef.current?.checked) {
            setValidation("Sie müssen wahlweise ein Zertifikat händisch widerrufen oder das älteste Zertifikat automatisch widerrufen lassen!");
        } else {
            setValidation(undefined);
        }
    }, [p12PasswordConfirmRef, p12PasswordRef, revokeRef, revokeRef.current]);

    if (Config.DisableUser) {
        return <Alert severity="warning">
            <AlertTitle>Hinweis</AlertTitle>
            Der Bezug von Nutzerzertifikaten ist derzeit deaktiviert!
        </Alert>;
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <div><Typography variant="h1">Erstellung eines neuen Nutzerzertifikats</Typography>
        {!error && <Box sx={{ display: "flex", flexDirection: "column", gap: "15px", width: "md", alignItems: "left" }}>

            {session && <Box sx={{ display: "flex", flexDirection: "column", alignItems: "left", alignSelf: "left", paddingBottom: "10px" }}>
                <Typography variant="h2">Aktuelle Benutzerdaten:</Typography>
                <Typography><b>Name:</b> {session.user.name}</Typography>
                <Typography><b>E-Mail:</b> {session.user.email}</Typography>
            </Box>}
            <Box component="form" onSubmit={create} sx={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "left", gap: "15px", alignSelf: "center" }}>

                <Box >
                    <Typography sx={{ paddingBottom: "10px" }}>Bitte vergeben Sie ein individuelles PKCS12 Import-Passwort.</Typography>
                    <TextField required id="pkcs12" label="PKCS12 Passwort" sx={{ paddingBottom: "10px" }} type="password" inputRef={p12PasswordRef} fullWidth variant="standard" onChange={validate} />
                    <TextField required id="pkcs12validation" label="PKCS12 Passwort Bestätigung" type="password" fullWidth inputRef={p12PasswordConfirmRef} variant="standard" onChange={validate} />
                </Box>
                <Box>
                    {warning && <Alert id="revoke" severity="warning">
                        <AlertTitle>Warnung</AlertTitle>
                        <Typography>Sie haben derzeit 5 aktive Nutzerzertifikate. </Typography>
                        <Typography>Durch Ausstellung eines neuen Zertifikats wird automatisch das ältere dieser beiden Zertifikate widerrufen. </Typography>
                        <Typography>Das Widerrufen eines Zertifikats kann nicht rückgängig gemacht werden!</Typography>
                        <Typography>Sofern Sie dies nicht möchten widerrufen Sie bitte ein Zertifikat von Hand. </Typography>
                    </Alert>}

                    {warning && <FormControlLabel control={<Checkbox color="secondary" onChange={validate} inputRef={revokeRef} required />} label="Ja, ich möchte das älteste aktive Zertifikat automatisch widerrufen." />}
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
        </Box>}
        {error && <Alert sx={{ width: "100%" }} severity="error">{error}</Alert>}
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

    </div >;
}
