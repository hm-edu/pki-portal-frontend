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

import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { AuthProps, Config } from "../../src/config";
import { modalTheme } from "../../src/theme";
import { getServerSideProps } from "../../src/auth";
import { AlertTitle, Table } from "@mui/material";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

async function createP12(privateKey: string, chain: string[], password: string): Promise<string> {

    const forge = (await import("node-forge")).default;
    return await new Promise((resolve, reject) => {
        const encodedChain = [];
        for (const cert of chain) {
            encodedChain.push(forge.pki.certificateFromPem(cert));
        }

        const encodedPrivateKey = forge.pki.privateKeyFromPem(privateKey);
        if (!encodedPrivateKey || !encodedChain || !password) {
            reject();
        }
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(encodedPrivateKey, encodedChain, password, { algorithm: "3des" });

        // base64-encode p12
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

        resolve(forge.util.encode64(p12Der));
    });
}

export default SMIMEGenerator;

export function SMIMEGenerator({ session, nonce }: { session: AuthProps | null; nonce: string }) {

    const [progress, setProgress] = useState<string>("");
    const [download, setDownload] = useState<JSX.Element>(<></>);

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [warning, setWarning] = useState(false);
    const [error, setError] = useState("");
    const [validation, setValidation] = useState<string | undefined>("Bitte geben Sie ein Passwort für das PKCS12-Datei an.");
    const p12PasswordRef = useRef<TextFieldProps>(null);
    const p12PasswordConfirmRef = useRef<TextFieldProps>(null);

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
            setProgress("Generiere CSR...");
            const CsrBuilder = (await import("../../src/csr")).CsrBuilder;
            const csr = new CsrBuilder();
            csr.build("rsa", undefined, 3072).then((x) => {
                setProgress("CSR generiert...");
                if (session) {
                    const cfg = new Configuration({ accessToken: session.accessToken });
                    const api = new SMIMEApi(cfg, `${Config.PKI_HOST}`);
                    setProgress("Signiere CSR...");
                    return api.smimeCsrPost({ csr: x.csr }).then((response) => {
                        setProgress("Generiere PKCS12...");
                        return createP12(x.privateKey, [response.data], p12PasswordRef.current?.value as string).then((p12) => {
                            const element = document.createElement("a");
                            element.setAttribute("href", "data:application/x-pkcs12;base64," + p12);
                            element.setAttribute("download", "smime.p12");
                            element.style.display = "none";
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                            setDownload(<Button variant="contained" startIcon={<FileDownload />} download="smime.p12" href={"data:application/x-pkcs12;base64," + p12}>Erneuter Download</Button>);
                            setProgress("PKCS12 generiert");
                            setSuccess(true);
                            setLoading(false);
                        }).catch((err) => {
                            console.log(err);
                        });
                    }).catch((error) => {
                        console.error(error);
                    });

                }
                return Promise.resolve();
            }).catch((error) => {
                console.log(error);
            });
        }
    };
    useEffect(() => {
        setProgress("Bitte warten...");
        if (session) {
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SMIMEApi(cfg, `${Config.PKI_HOST}`);
            api.smimeGet().then((response) => {
                if (response) {
                    let active = 0;
                    for (const cert of response.data) {
                        if (cert.status != "revoked") {
                            active++;
                        }
                    }
                    if (active >= 2) {
                        setWarning(true);
                    }
                }

                setLoading(false);
            }).catch((error) => {
                setLoading(false);
                console.error(error);
            });
        } else {
            setLoading(false);
            setError("Sie sind nicht angemeldet!");
        }
    }, [session]);

    const validate = useCallback(() => {
        if (p12PasswordRef.current?.value == "") {
            setValidation("Bitte geben Sie ein Passwort für das PKCS12-Datei an.");
        } else if (p12PasswordRef.current?.value != p12PasswordConfirmRef.current?.value) {
            setValidation("Die eingegebenen Passwörter stimmen nicht überein.");
        } else {
            setValidation(undefined);
        }
    }, [p12PasswordConfirmRef, p12PasswordRef]);

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <div>
        <Typography variant="h1">Erstellung eines neuen SMIME Zertifikats</Typography>
        {!error && <Box sx={{ display: "flex", flexDirection: "column", width: "md", alignItems: "left" }}>
            {session && <Box sx={{ display: "flex", flexDirection: "column", alignItems: "left", alignSelf: "left", paddingBottom: "10px" }}>
                <Typography variant="h2">Aktuelle Benutzerdaten:</Typography>
                <Typography><b>Name:</b> {session.user.name}</Typography>
                <Typography><b>E-Mail:</b> {session.user.email}</Typography>
            </Box>}
            <Box component="form" onSubmit={create} sx={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "left", gap: "10px", alignSelf: "center" }}>

                <Box>
                    <Typography >Bitte definieren Sie ein individuelles PKCS12 Import-Passwort.</Typography>
                    <TextField required label="PKCS12 Passwort" type="password" inputRef={p12PasswordRef} fullWidth variant="standard" onChange={validate} />
                    <TextField required label="PKCS12 Passwort Bestätigung" type="password" fullWidth inputRef={p12PasswordConfirmRef} variant="standard" onChange={validate} />
                </Box>
                {validation && <Alert variant="filled" severity="warning">{validation}</Alert>}
                {warning && <Alert severity="warning">
                    <AlertTitle>Warnung</AlertTitle>
                    <Typography>Sie haben derzeit 2 aktive SMIME Zertifikate. </Typography>
                    <Typography>Durch Ausstellung eines neuen Zertifikats wird automatisch das ältere dieser beiden Zertifikate widerrufen. </Typography>
                    <Typography>Das Widerrufen eines Zertifikats kann nicht rückgängig gemacht werden!</Typography>
                    <Typography>Sofern Sie dies nicht möchten widerrufen Sie bitte ein Zertifikat von Hand. </Typography>
                </Alert>}
                {warning && <FormControlLabel control={<Checkbox color="secondary" required />} label="Ja, ich möchte das ältere aktive Zertifikat automatisch widerrufen." />}
                <Button type="submit" variant="outlined" color="inherit" disabled={(loading || success) || (validation != undefined) || p12PasswordRef.current?.value == ""} sx={buttonSx}>Generiere Zertifikat {loading && (
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                )}</Button>
                {download}
            </Box>
        </Box>}
        {error && <Alert sx={{ width: "100%" }} severity="error">{error}</Alert>}
        <Modal open={loading} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={modalTheme}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen SMIME Zertifikats
                </Typography>
                <Box sx={{ padding: 2 }}>
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                </Box>
                <Typography id="modal-modal-description" sx={{ mt: "24px" }}>
                    {progress}
                </Typography>
            </Box>
        </Modal>

    </div>;
}

export { getServerSideProps };