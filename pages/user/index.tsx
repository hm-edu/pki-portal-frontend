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

import { DataGrid, deDE, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { PortalApisListSmimeResponseCertificateDetails, SMIMEApi } from "@/api/pki/api";
import { Configuration } from "@/api/pki/configuration";
import { Config } from "@/components/config";
import { dataGridStyle } from "@/components/theme";
import Link from "next/link";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useSession } from "next-auth/react";
import { green } from "@mui/material/colors";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";

export default SmimeCertificates;

export function SmimeCertificates() {
    const [open, setOpen] = useState(false);
    const reason = useRef<TextFieldProps>(null);
    const [pageModel, setPageModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const [selection, setSelection] = useState<PortalApisListSmimeResponseCertificateDetails | undefined>(undefined);
    const [certificates, setCertificates] = useState([] as PortalApisListSmimeResponseCertificateDetails[]);
    const { data: session, status } = useSession();
    const [revoking, setRevoking] = useState(false);

    function revoke() {
        const item = selection;
        if (session) {
            if (item && item.serial) {
                const cfg = new Configuration({ accessToken: session.accessToken });
                const api = new SMIMEApi(cfg, `${Config.PkiHost}`);
                setRevoking(true);
                api.smimeRevokePost({ serial: item.serial, reason: (reason.current?.value as string) }).then(() => {
                    load();
                    setSelection(undefined);
                    setRevoking(false);
                    setOpen(false);
                }).catch((error) => {
                    Sentry.captureException(error);
                    setRevoking(false);
                    return;
                });
            }
        }
    }
    function load() {
        if (status == "authenticated") {
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SMIMEApi(cfg, `${Config.PkiHost}`);
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
                Sentry.captureException(error);
                setLoading(false);
                setError(true);
            });
        } else if (status == "unauthenticated") {
            setLoading(false);
            setCertificates([]);
            setError("Bitte melden Sie sich an!");
        }

    }

    useEffect(() => {
        load();
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

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
            minWidth: 150,
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

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Nutzerzertifikate</Typography>
        {(error && <Alert severity="error">{typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten."}</Alert>) || <>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <DataGrid columns={columns}
                    sx={dataGridStyle}
                    paginationModel={pageModel}
                    getRowId={(row) =>
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
                        row.serial
                    }
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "notBefore", sort: "desc" }],
                        },
                    }}
                    slots={{ loadingOverlay: LinearProgress }}
                    slotProps={{ loadingOverlay: { color: "inherit" } }}
                    loading={loading}
                    localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                    onPaginationModelChange={(newPageModel) => setPageModel(newPageModel)}
                    pageSizeOptions={[5, 15, 25, 50, 100]}
                    pagination rows={certificates}></DataGrid>
            </div>
            {
                <Tooltip title={<Box>
                Aufgrund der Einführung der SMIME Baseline Requirements ist die Ausstellung von Nutzerzertifikaten derzeit nicht möglich.
                </Box>}>
                    <Link legacyBehavior={true} href="/user/new"><Button id="new" variant="contained" disabled={true} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, width: "100%" }}>Neues Zertifikat beziehen</Button></Link>
                </Tooltip>
            }
        </>}
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Nutzerzertifikat widerrufen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten das Nutzerzertifikat mit Seriennummer {selection?.serial} widerrufen.

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
                <Button key="cancel" color="inherit" variant="outlined" disabled={revoking} onClick={handleClose}>Abbrechen</Button>
                <Button key="revoke" color="warning" variant="outlined" disabled={revoking} onClick={() => revoke()}>Widerrufen {revoking && <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />} </Button>
            </DialogActions>
        </Dialog>
    </Box>;
}
