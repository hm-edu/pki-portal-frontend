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

import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useRef, useState } from "react";

import { PortalApisListSmimeResponseCertificateDetails, SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { Config } from "../../config";
import { useAuth } from "react-oidc-context";

export default function SmimeCertificates() {
    const auth = useAuth();
    const [open, setOpen] = useState(false);
    const reason = useRef<TextFieldProps>(null);
    const [pageSize, setPageSize] = useState<number>(15);
    const [loading, setLoading] = useState(true);
    const [selection, setSelection] = useState<PortalApisListSmimeResponseCertificateDetails | undefined>(undefined);
    const [certificates, setCertificates] = useState([] as PortalApisListSmimeResponseCertificateDetails[]);

    function revoke() {
        const item = selection;
        if (auth.isAuthenticated && auth.user) {
            if (item && item.serial) {
                const cfg = new Configuration({ accessToken: auth.user.access_token });
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
        if (auth.isAuthenticated && auth.user) {
            const cfg = new Configuration({ accessToken: auth.user.access_token });
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
            }).catch((error) => {
                setLoading(false);
                console.error(error);
            });

        }

    }

    useEffect(() => {
        load();
    }, [auth]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setSelection(undefined);
        setOpen(false);
    };

    if (!auth.isAuthenticated) {
        return <div>Please sign in</div>;
    }

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

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><h1>Ihre Zertifikate</h1>
        <DataGrid columns={columns}
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
            components={{
                LoadingOverlay: LinearProgress,
            }}
            componentsProps={{ loadingOverlay: { color: "inherit" } }}
            loading={loading}
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
        <Button variant="contained" color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} href="/smime/new">Neues Zertifikat beziehen</Button>
    </Box>;
}
