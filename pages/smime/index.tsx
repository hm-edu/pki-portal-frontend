import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import DeleteIcon from "@mui/icons-material/Delete";
import LinearProgress from "@mui/material/LinearProgress";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { DataGrid, deDE, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useRef, useState } from "react";

import { PortalApisListSmimeResponseCertificateDetails, SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { AuthProps, Config } from "../../src/config";
import { getServerSideProps } from "../../src/auth";
import { dataGridStyle } from "../../src/theme";
import Link from "next/link";
import { Typography } from "@mui/material";

export default SmimeCertificates;

export function SmimeCertificates({ session, nonce }: { session: AuthProps | null; nonce: string }) {
    const [open, setOpen] = useState(false);
    const reason = useRef<TextFieldProps>(null);
    const [pageSize, setPageSize] = useState<number>(15);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const [selection, setSelection] = useState<PortalApisListSmimeResponseCertificateDetails | undefined>(undefined);
    const [certificates, setCertificates] = useState([] as PortalApisListSmimeResponseCertificateDetails[]);

    function revoke() {
        const item = selection;
        if (session) {
            if (item && item.serial) {
                const cfg = new Configuration({ accessToken: session.accessToken });
                const api = new SMIMEApi(cfg, `${Config.PKI_HOST}`);
                api.smimeRevokePost({ serial: item.serial, reason: (reason.current?.value as string) }).then(() => {
                    load();
                    setSelection(undefined);
                    setOpen(false);
                }).catch(() => {
                    return;
                });
            }
        }
    }
    function load() {
        if (session) {
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SMIMEApi(cfg, `${Config.PKI_HOST}`);
            api.smimeGet().then((response) => {
                if (response.data) {
                    const data = [];
                    for (const cert of response.data) {
                        if (cert.serial) {
                            data.push({
                                expires: cert.expires,
                                serial: cert.serial,
                                status: cert.status,
                            });
                        }
                    }
                    setCertificates(data);
                }
                setLoading(false);
            }).catch(() => {
                setLoading(false);
                setError("Es ist ein unbekannter Fehler aufgetreten.");
            });
        } else {
            setLoading(false);
            setError("Bitte melden Sie sich an!");
        }

    }

    useEffect(() => {
        load();
    }, [session]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setSelection(undefined);
        setOpen(false);
    };

    const columns: GridColDef[] = [
        { field: "serial", headerName: "Serial Number", width: 280 },
        {
            field: "status", width: 150, type: "string", headerName: "Status",
        },
        {
            field: "expires", headerName: "Gültig bis", type: "date", width: 150,
            valueGetter: ({ value }) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (value.seconds as number) * 1000;
                if (!mili) {
                    console.log(value);
                }

                return value && new Date(mili);
            },
        }, {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            minWidth: 250,
            renderCell: (params) => {
                const row = (params.row as PortalApisListSmimeResponseCertificateDetails);
                if (row.status !== "revoked") {
                    return <Button variant="outlined" onClick={() => {
                        setSelection(row);
                        handleClickOpen();
                    }} sx={{ px: 1, mx: 1 }} color="warning" startIcon={<DeleteIcon />} key="revoke">Widerrufen</Button>;
                }
                return <></>;
            },
        },
    ];

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Benutzerzertifikate</Typography>
        <DataGrid columns={columns}
            sx={dataGridStyle}
            pageSize={pageSize}
            getRowId={(row) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  
                row.serial
            }
            initialState={{
                sorting: {
                    sortModel: [{ field: "notBefore", sort: "desc" }],
                },
            }}
            nonce={nonce}
            components={{ LoadingOverlay: LinearProgress }}
            componentsProps={{ loadingOverlay: { color: "inherit" } }}
            loading={loading}
            localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText, errorOverlayDefaultLabel: typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten." }}
            error={error}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>SMIME Zertifikat widerrufen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten das SMIME Zertifikat mit Seriennummer widerrufen.

                    Bitte geben Sie einen Grund ein.
                </DialogContentText>
                <TextField
                    inputRef={reason}
                    autoFocus
                    margin="dense"
                    id="reason"
                    label="Grund"
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button color="inherit" variant="outlined" onClick={handleClose}>Abbrechen</Button>
                <Button color="warning" variant="outlined" onClick={() => revoke()}>Widerrufen</Button>
            </DialogActions>
        </Dialog>
        <Link href="/smime/new"><Button variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }}>Neues Zertifikat beziehen</Button></Link>
    </Box>;
}

export { getServerSideProps };