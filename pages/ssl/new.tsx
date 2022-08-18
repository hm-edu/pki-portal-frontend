/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { green } from "@mui/material/colors";
import { DataGrid, GridRowId } from "@mui/x-data-grid";
import FileDownload from "@mui/icons-material/FileDownload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Stack from "@mui/material/Stack";
import ListItem from "@mui/material/ListItem";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";

import React, { FormEvent, useEffect, useState, useRef, FormEventHandler } from "react";
import { DomainsApi, ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { SSLApi } from "../../api/pki/api";
import { Configuration as PKIConfig } from "../../api/pki/configuration";
import { AuthProps, Config } from "../../components/config";
import { Buffer } from "buffer";
import { KeyPair } from "../../components/keypair";
import { modalTheme } from "../../components/theme";
import { IncomingMessage, ServerResponse } from "http";
import { unstable_getServerSession } from "next-auth";
import { NextApiRequestCookies } from "next/dist/server/api-utils";
import { authOptions } from "../api/auth/[...nextauth]";

export function SslGenerator({ session }: { session: AuthProps | null }) {

    interface SwitchProps {
        checked: boolean;
    }

    const columnStyle = {
        flex: "auto",
        minWidth: "49%",
        maxWidth: "100%",
        display: "flex",
        height: "100%",
        gap: "5px",
        flexDirection: "column",
        alignContent: "flex-start",
    };

    const [progress, setProgress] = useState<JSX.Element>(<></>);
    const [loadingDomains, setLoadingDomains] = useState(true);
    const [error, setError] = useState<boolean>(false);
    const [generateKey, setGenerateKey] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(false);
    const [keypair, setKeyPair] = useState<KeyPair>();
    const [domains, setDomains] = useState<ModelDomain[]>([]);
    const [selected, setSelected] = useState<GridRowId[]>();
    const [pageSize, setPageSize] = useState<number>(15);

    const buttonSx = {
        ...(generatedKey && {
            bgcolor: green[500],
            "&:hover": {
                bgcolor: green[700],
            },
        }), mt: 3, mb: 2,
    };
    const switchRef = useRef<SwitchProps>(null);

    function keySegment(segment: string, fileName: string, label: string) {
        return <Box sx={columnStyle}>
            <Typography variant="h6">{label}</Typography>
            <Button color="inherit" variant="outlined" startIcon={<FileDownload />} download={fileName} href={"data:application/x-pem-file;base64," + Buffer.from(segment).toString("base64")}>Herunterladen</Button>
            <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{segment}</code>
            <Button color="inherit" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { void navigator.clipboard.writeText(segment); }}>In die Zwischenablage kopieren</Button>
        </Box>;
    }

    const createHandler: FormEventHandler<HTMLFormElement> = (event: FormEvent) => {
        event.preventDefault();
        void create();
    };

    useEffect(() => {
        if (session) {
            setProgress(<Typography>Bitte warten...</Typography>);
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
            api.domainsGet().then((response) => {
                setDomains(response.data.filter(x => x.approved));
                setLoadingDomains(false);
            }).catch(() => {
                setLoadingDomains(false);
            });
        } else {
            setLoadingDomains(false);
            setProgress(<Typography>Sie sind nicht angemeldet</Typography>);
            setError(true);
        }
    }, [session]);

    const columns = [
        {
            field: "fqdn", headerName: "FQDN",
            flex: 1,
        },
    ];

    let body: JSX.Element | undefined = undefined;

    let publicKeyElement: JSX.Element = <></>;
    if (generateKey) {
        publicKeyElement = <Box>
            <Box sx={{ padding: 2 }}>
                <CircularProgress size={24} sx={{ color: green[500], position: "relative", left: "50%", marginLeft: "-12px" }} />
            </Box>
            <Box id="modal-modal-description">
                {progress}
            </Box>
        </Box>;
    } else if (keypair && keypair.public && !generateKey) {
        publicKeyElement = keySegment(keypair.public, "public.pem", "Öffentlicher Schlüssel");
    }

    if (!generatedKey && !generateKey && !error) {
        body = <Box sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
            <Box sx={{ width: "100%", height: "100%", display: "flex", gap: "10px", flexDirection: "row" }}>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", height: "100%", flexDirection: "column" }}>
                    <Typography variant="h6">Ihre Domains:</Typography>
                    <DataGrid columns={columns}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: "fqdn", sort: "asc" }],
                            },
                        }}
                        pageSize={pageSize} selectionModel={selected}
                        onSelectionModelChange={(event) => {
                            setSelected(event);
                        }}
                        loading={loadingDomains} density="compact"
                        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                        rowsPerPageOptions={[5, 15, 25, 50, 100]}
                        pagination checkboxSelection rows={domains}></DataGrid>
                </Box>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>
                    <Typography variant="h6">Aktuelle Auswahl:</Typography>
                    <List dense sx={{ flex: "auto", width: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>
                        {selected && selected.length > 0 && domains.filter(x => selected.includes(x.id!)).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => {
                            const labelId = `checkbox-list-label-${domain.id!}`;
                            return <ListItem sx={{ display: "flex" }} key={domain.id} disablePadding> <ListItemText id={labelId} primary={domain.fqdn} /> </ListItem>;
                        })}
                    </List>
                </Box>
            </Box>
            <Box>
                <Typography variant="h6">Schlüsslart:</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>RSA</Typography>
                    <Switch defaultChecked color="secondary" inputRef={switchRef} />
                    <Typography>ECDSA</Typography>
                </Stack></Box>

            <Button type="submit" color="inherit" variant="outlined" disabled={loadingDomains || generateKey || generatedKey} sx={buttonSx}>Generiere Zertifikat {loadingDomains && (
                <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
            )}</Button>
        </Box>;
    } else if (error) {
        body = <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
            <Alert severity="error">{progress}</Alert>
        </Box>;
    } else if (generatedKey || generateKey && keypair?.private) {
        body = <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
            {keySegment(keypair!.private, "private.pem", "Privater Schlüssel")}
            <Box sx={columnStyle}>
                {publicKeyElement}
            </Box>
        </Box>;
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <Box sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
        <Box component="form" onSubmit={createHandler} sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
            <h1>Erstellung eines neuen SSL Zertifikats</h1>
            {body}
        </Box>
        <Modal open={loadingDomains} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={modalTheme}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen SSL Zertifikats
                </Typography>
                <Box sx={{ padding: 2 }}>
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                </Box>
                <Box id="modal-modal-description" sx={{ mt: "24px" }}>
                    {progress}
                </Box>
            </Box>
        </Modal>
    </Box >;

    async function create() {
        setProgress(<Typography>Erstelle privaten Schüssel</Typography>);
        if (!loadingDomains && selected && session?.accessToken) {
            const fqdns = domains.filter(x => selected.includes(x.id!)).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => domain.fqdn!);
            const CsrBuilder = (await import("../../components/csr")).CsrBuilder;
            const csr = new CsrBuilder();
            csr.build(switchRef.current?.checked ? "ecdsa" : "rsa", fqdns).then((result) => {
                setKeyPair({ private: result.privateKey, public: undefined });
                setGenerateKey(true);
                setProgress(<><Typography>Signiere CSR...</Typography><Typography>(Dieser Schritt kann bis zu 5 Minuten dauern!)</Typography></>);
                const cfg = new PKIConfig({ accessToken: session.accessToken });
                const api = new SSLApi(cfg, `${Config.PKI_HOST}`);
                api.sslCsrPost({ csr: result.csr }).then((response) => {
                    const element = document.createElement("a");
                    element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(response.data).toString("base64"));
                    element.setAttribute("download", "public.pem");
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);

                    element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(result.privateKey).toString("base64"));
                    element.setAttribute("download", "private.pem");
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    setKeyPair({ private: result.privateKey, public: response.data });
                    setGeneratedKey(true);
                    setLoadingDomains(false);
                    setGenerateKey(false);
                }).catch(() => {
                    setProgress(<>
                        Es ist ein unbekannter Fehler bei der Erstellung des Zertifikats aufgetreten. Bitte versuchen Sie es erneut oder wenden sich an den IT-Support
                    </>);
                    setError(true);
                    setGenerateKey(false);
                    setLoadingDomains(false);
                });
            }).catch(() => {
                setProgress(<>
                    Es ist ein unbekannter Fehler bei der Erstellung des Zertifikats aufgetreten. Bitte versuchen Sie es erneut oder wenden sich an den IT-Support
                </>);
                setError(true);
                setGenerateKey(false);
                setLoadingDomains(false);
            });
        }
    }
}

export default SslGenerator;

export async function getServerSideProps(context: { req: IncomingMessage & { cookies: NextApiRequestCookies }; res: ServerResponse }): Promise<{ props: { session: AuthProps | null } }> {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);
    const data = session?.accessToken ? { accessToken: session.accessToken } : null;
    return {
        props: {
            session: data,
        },
    };
}