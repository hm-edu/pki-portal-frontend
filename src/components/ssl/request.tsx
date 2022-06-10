/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, CircularProgress, List, ListItem, ListItemText, Modal, Typography } from "@mui/material";
import { green } from "@mui/material/colors";
import { Box } from "@mui/system";
import { DataGrid, GridRowId } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useState } from "react";
import { DomainsApi, ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { SSLApi } from "../../api/pki/api";
import { Configuration as PKIConfig } from "../../api/pki/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";
import "./request.scss";
import { Buffer } from "buffer";
import { FileDownload } from "@mui/icons-material";
declare global {
    export interface Window {
        generateCSR: (sans: string, type: string, handler: (err: string, key: string, csr: string) => void) => void;
    }
}

export interface KeyPair {
    private: string;
    public: string | undefined;
}
export default function SslGenerator() {

    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const account = useAccount(accounts[0])!;
    const [progress, setProgress] = React.useState<string>("");

    const [loading, setLoading] = React.useState(true);
    const [processing, setProcessing] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [keypair, setKeyPair] = React.useState<KeyPair>();
    const [domains, setDomains] = React.useState<ModelDomain[]>([]);

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
    const [selected, setSelected] = useState<GridRowId[]>();
    const [pageSize, setPageSize] = React.useState<number>(15);

    const create = useCallback((event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        event.preventDefault();
        if (!loading && selected) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response) => {
                if (response) {
                    const fqdns = JSON.stringify(domains.filter(x => selected.includes(x.id!)).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => domain.fqdn!));
                    new Promise<{ key: string; csr: string }>((resolve, reject) => {
                        window.generateCSR(fqdns, "ecdsa", (err, key, csr) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ key, csr });
                            }
                        });
                    }).then((result) => {
                        setKeyPair({ private: result.key, public: undefined });
                        setProcessing(true);
                        setProgress("Signiere CSR...\n(Dieser Schritt kann bis zu 5 Minuten dauern!)");
                        const cfg = new PKIConfig({ accessToken: response.accessToken });
                        const api = new SSLApi(cfg, `https://${Config.PKI_HOST}`);
                        api.sslCsrPost({ csr: result.csr }).then((response) => {
                            const element = document.createElement("a");
                            element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(response.data).toString("base64"));
                            element.setAttribute("download", "public.pem");
                            element.style.display = "none";
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);

                            element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(result.key).toString("base64"));
                            element.setAttribute("download", "private.pem");
                            element.style.display = "none";
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                            setKeyPair({ private: result.key, public: response.data });
                            setSuccess(true);
                            setLoading(false);
                            setProcessing(false);
                        }).catch((err) => {
                            console.error(err);
                            setProgress("");
                            setProcessing(false);
                            setLoading(false);
                        });
                    }).catch((err) => {
                        console.error(err);
                        setProgress("");
                        setProcessing(false);
                        setLoading(false);
                    });
                }

            }, () => { setLoading(false); });
        }
    }, [account, instance, progress, loading, selected]);

    useEffect(() => {
        setProgress("Bitte warten...");
        if (account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response) => {
                if (response) {
                    const cfg = new Configuration({ accessToken: response.accessToken });
                    const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
                    api.domainsGet().then((response) => {
                        setDomains(response.data.filter(x => x.approved));
                        setLoading(false);
                    }).catch(() => {
                        setLoading(false);
                    });
                }
            }, () => { setLoading(false); });
        }
    }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please login</div>;
    }

    let processingElement: JSX.Element;
    if (processing) {
        processingElement = <Box>
            <Box sx={{ padding: 2 }}>
                <CircularProgress size={24} sx={{ color: green[500], position: "relative", left: "50%", marginLeft: "-12px" }} />
            </Box>
            <Typography id="modal-modal-description">
                {progress}
            </Typography>
        </Box>;
    } else if (keypair && keypair.public && !processing) {
        processingElement = <>
            <Button variant="contained" startIcon={<FileDownload />} download="public.pem" href={"data:application/x-pem-file;base64," + Buffer.from(keypair.public).toString("base64")}>Herunterladen</Button>
            <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{keypair.public}</code>
        </>;
    } else {
        processingElement = <></>;
    }

    const columns = [
        { field: "fqdn", headerName: "FQDN", width: 280 },
    ];

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <Box sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
        <Box component="form" onSubmit={create} sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
            <h1>Erstellung eines neuen SSL Zertifikats</h1>
            {(!success && !processing) && <Box sx={{ width: "100%", height: "100%", display: "flex", gap: "10px", flexDirection: "row" }}>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", height: "100%", flexDirection: "column" }}>
                    <Typography variant="h6">Ihre Domains:</Typography>
                    <DataGrid columns={columns}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: "fqdn", sort: "asc" }],
                            },
                        }}
                        pageSize={pageSize}
                        selectionModel={selected}
                        onSelectionModelChange={(event) => {
                            setSelected(event);
                        }}
                        loading={loading}
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
            }
            {(success || processing) && <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", height: "100%", gap: "5px", flexDirection: "column", alignContent: "flex-start" }}>
                    <Typography variant="h6">Privater Schlüssel:</Typography>
                    <Button variant="contained" startIcon={<FileDownload />} download="private.pem" href={"data:application/x-pem-file;base64," + Buffer.from(keypair!.private).toString("base64")}>Herunterladen</Button>
                    <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{keypair?.private}</code>
                </Box>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", height: "100%", gap: "5px", flexDirection: "column", alignContent: "flex-start" }}>
                    <Typography variant="h6">
                        Öffentlicher Schlüssel:
                    </Typography>
                    {processingElement}
                </Box>

            </Box>}
            <Button type="submit" variant="contained" disabled={loading || processing || success} sx={buttonSx}>Generiere Zertifikat {loading && (
                <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
            )}</Button>
        </Box>
        <Modal open={loading} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen SSL Zertifikats
                </Typography>
                <Box sx={{ padding: 2 }}>
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                </Box>
                <Typography id="modal-modal-description" sx={{ mt: "24px" }}>
                    {progress}
                </Typography>
            </Box>
        </Modal>
    </Box >;

}