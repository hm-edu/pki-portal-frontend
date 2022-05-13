/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, Checkbox, CircularProgress, FormControlLabel, Modal, TextField, TextFieldProps, Typography } from "@mui/material";
import { green } from "@mui/material/colors";
import { Box } from "@mui/system";
import * as forge from "node-forge";
import React, { useCallback, useEffect, useRef } from "react";
import { SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { Config } from "../../config";

export class CSRBundle {
    constructor(public csr: string, public privateKey: string) { }
}

export class CSRBuilder {

    build(): Promise<CSRBundle> {
        return new Promise((resolve, reject) => {
            const KEY_SIZE = 4096;
            forge.pki.rsa.generateKeyPair(
                { bits: KEY_SIZE, workers: -1 },
                (err, keys) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            const csr = this.createCSR(keys);
                            const pkcs10PEM = forge.pki.certificationRequestToPem(csr);
                            const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
                            resolve(new CSRBundle(pkcs10PEM, privateKey));
                        } catch (err) {
                            reject(err);
                        }
                    }
                },
            );
        });
    }

    createCSR(keys: forge.pki.rsa.KeyPair) {
        const csr = forge.pki.createCertificationRequest();
        csr.publicKey = keys.publicKey;
        // sign certification request
        csr.sign(keys.privateKey, forge.md.sha256.create());
        return csr;
    }
}

export function checkPEM(pem: string) {
    const pattern = /^-----BEGIN [ A-Z]+-----\r?\n([A-Za-z0-9+/]{64}\r?\n)*[A-Za-z0-9+/]{0,64}={0,3}\r?\n-----END [ A-Z]+-----\r?\n$/;

    if (!pem.match(pattern)) {
        return false;
    }
    return true;
}

export function createP12(privateKey: string, chain: string[], password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const encodedChain = [];
        for (const cert of chain) {
            checkPEM(cert);
            encodedChain.push(forge.pki.certificateFromPem(cert));
        }

        const encodedPrivateKey = forge.pki.privateKeyFromPem(privateKey);
        if (!encodedPrivateKey || !encodedChain || !password) {
            reject();
        }
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(encodedPrivateKey, encodedChain, password);

        // base64-encode p12
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

        resolve(forge.util.encode64(p12Der));
    });
}

export default function SMIMEGenerator() {

    const csr = new CSRBuilder();
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const account = useAccount(accounts[0])!;
    const [progress, setProgress] = React.useState<JSX.Element>(<></>);
    const [download, setDownload] = React.useState<JSX.Element>(<></>);

    const [loading, setLoading] = React.useState(true);
    const [success, setSuccess] = React.useState(false);
    const [warning, setWarning] = React.useState(false);
    const p12PasswordRef = useRef<TextFieldProps>(null);

    const buttonSx = {
        ...(success && {
            bgcolor: green[500],
            "&:hover": {
                bgcolor: green[700],
            },
        }), mt: 3, mb: 2,
    };
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };
    const create = useCallback(async (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        event.preventDefault();
        if (!loading) {
            setSuccess(false);
            setLoading(true);
            await instance.acquireTokenSilent({
                scopes: ["api://9aee5c12-b8ba-42e0-a1bb-b296bb6ca978/Certificates", "email"],
                account,
            }).then((response) => {
                if (response) {
                    setProgress(<div>Generiere CSR...</div>);

                    return csr.build().then((x) => {
                        setProgress(<p>CSR generiert...</p>);
                        if (account) {

                            const cfg = new Configuration({ accessToken: response.accessToken });
                            const api = new SMIMEApi(cfg, `https://${Config.PKI_HOST}`);
                            setProgress(<p>Signiere CSR...</p>);
                            return api.smimeCsrPost({ csr: x.csr }).then((response) => {
                                setProgress(<p>Generiere PKCS12...</p>);
                                return createP12(x.privateKey, [response.data], p12PasswordRef.current?.value as string).then((p12) => {
                                    console.log(p12);
                                    const element = document.createElement("a");
                                    element.setAttribute("href", "data:application/x-pkcs12;base64," + p12);
                                    element.setAttribute("download", "smime.p12");
                                    element.style.display = "none";
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                    setDownload(<a href={"data:application/x-pkcs12;base64," + p12} download="smime.p12">Erneuter Download</a>);
                                    setProgress(<p>PKCS12 generiert</p>);
                                    setSuccess(true);
                                    setLoading(false);
                                }).catch((err) => {
                                    console.log(err);
                                });
                            }).catch((error) => {
                                console.error(error);
                            });
                        }
                        return Promise.reject();
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                return Promise.reject(new Error("No token"));
            }).catch((y) => { console.error(y); });
        }
    }, [account, instance, progress]);
    useEffect(() => {
        setProgress(<p>Bitte warten...</p>);
        if (account) {
            instance.acquireTokenSilent({
                scopes: ["api://9aee5c12-b8ba-42e0-a1bb-b296bb6ca978/Certificates", "email"],
                account: account,
            }).then((response) => {
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
            }).catch((error) => {
                console.log(error);
            });
        }
    }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please login</div>;
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <div>
        <h1>Erstellung eines neuen SMIME Zertifikats</h1>
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Box component="form" onSubmit={create}
                sx={{
                    display: "flex",
                    maxWidth: "md",
                    flexDirection: "column",
                    alignItems: "left",
                    alignSelf: "center",
                }}>
                {warning && <Typography>Sie haben derzeit 2 aktive SMIME Zertifikate. Durch Ausstellung eines neuen Zertifikats wird automatisch das älteste widerrufen. Sofern Sie dies nicht möchten widerrufen Sie bitte ein Zertifikat von Hand.</Typography>}
                {warning && <FormControlLabel control={<Checkbox color="secondary" required />} label="Zertifikat automatisch widerrufen." />}
                <TextField required
                    label="Password"
                    type="password"
                    inputRef={p12PasswordRef}
                    variant="standard" />
                <Button type="submit" variant="contained" disabled={loading || success} sx={buttonSx}>Generiere Zertifikat {loading && (
                    <CircularProgress
                        size={24}
                        sx={{
                            color: green[500],
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            marginTop: "-12px",
                            marginLeft: "-12px",
                        }}
                    />
                )}</Button>
                {download}
            </Box>
        </Box>
        <Modal
            open={loading}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen SMIME Zertifikats
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    {progress}
                </Typography>
            </Box>
        </Modal>

    </div>;
}