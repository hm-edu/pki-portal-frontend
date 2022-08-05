/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { FileDownload } from "@mui/icons-material";
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

import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import * as forge from "node-forge";
import React, { FormEvent, useCallback, useEffect, useRef } from "react";
import { SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";
import { modalTheme } from "../../theme";
import { CsrBuilder } from "../csr";

function createP12(privateKey: string, chain: string[], password: string): Promise<string> {
    return new Promise((resolve, reject) => {
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

export default function SMIMEGenerator() {

    const csr = new CsrBuilder();
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const account = useAccount(accounts[0])!;
    const [progress, setProgress] = React.useState<string>("");
    const [download, setDownload] = React.useState<JSX.Element>(<></>);

    const [loading, setLoading] = React.useState(true);
    const [success, setSuccess] = React.useState(false);
    const [warning, setWarning] = React.useState(false);
    const [validation, setValidation] = React.useState<string | undefined>(undefined);
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
    const create = useCallback((event: FormEvent<Element>) => {
        event.preventDefault();
        if (!loading) {
            setSuccess(false);
            setLoading(true);
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response) => {
                if (response) {
                    setProgress("Generiere CSR...");
                    csr.build("rsa", undefined, 4096).then((x) => {
                        setProgress("CSR generiert...");
                        if (account) {
                            const cfg = new Configuration({ accessToken: response.accessToken });
                            const api = new SMIMEApi(cfg, `https://${Config.PKI_HOST}`);
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
            }, () => { setLoading(false); });
        }
    }, [account, instance, progress, loading]);
    useEffect(() => {
        setProgress("Bitte warten...");
        if (account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response) => {
                if (response) {
                    const cfg = new Configuration({ accessToken: response.accessToken });
                    const api = new SMIMEApi(cfg, `https://${Config.PKI_HOST}`);
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
                }
            }, () => { setLoading(false); });
        }
    }, [account, instance]);

    const validate = useCallback(() => {
        if (p12PasswordRef.current?.value == "") {
            setValidation("Bitte geben Sie ein Passwort für das PKCS12-Datei an.");
        }
        if (p12PasswordRef.current?.value != p12PasswordConfirmRef.current?.value) {
            setValidation("Die eingegebenen Passwörter stimmen nicht überein.");
        } else {
            setValidation(undefined);
        }
    }, [p12PasswordConfirmRef, p12PasswordRef]);

    if (!isAuthenticated) {
        return <div>Please login</div>;
    }
    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <div>
        <h1>Erstellung eines neuen SMIME Zertifikats</h1>
        <Box sx={{ display: "flex", flexDirection: "column", width: "md", alignItems: "center" }}>
            <Box component="form" onSubmit={create} sx={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "left", gap: "10px", alignSelf: "center" }}>
                {warning && <Typography>Sie haben derzeit 2 aktive SMIME Zertifikate. Durch Ausstellung eines neuen Zertifikats wird automatisch das ältere dieser beiden Zertifikate widerrufen. Sofern Sie dies nicht möchten widerrufen Sie bitte ein Zertifikat von Hand.</Typography>}
                {warning && <FormControlLabel control={<Checkbox color="secondary" required />} label="Zertifikat automatisch widerrufen." />}
                <TextField required label="PKCS12 Password" type="password" inputRef={p12PasswordRef} fullWidth variant="standard" onChange={validate} />
                <TextField required label="PKCS12 Passwort Bestätigung" type="password" fullWidth inputRef={p12PasswordConfirmRef} variant="standard" onChange={validate} />
                {validation && <Alert variant="filled" severity="warning">{validation}</Alert>}
                <Button type="submit" variant="outlined" color="inherit" disabled={(loading || success) || (validation != undefined)} sx={buttonSx}>Generiere Zertifikat {loading && (
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                )}</Button>
                {download}
            </Box>
        </Box>
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