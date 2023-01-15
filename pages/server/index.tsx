import TextField, { TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { DataGrid, deDE, GridColDef, GridRowId } from "@mui/x-data-grid";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Moment from "react-moment";
import * as Sentry from "@sentry/nextjs";

import { PortalApisSslCertificateDetails, SSLApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { Config } from "../../src/config";
import { dataGridStyle } from "../../src/theme";
import Typography from "@mui/material/Typography";
import { useSession } from "next-auth/react";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function SslCertificates() {
    const [pageSize, setPageSize] = useState<number>(50);
    const [loading, setLoading] = useState(true);
    const reason = useRef<TextFieldProps>(null);
    const [open, setOpen] = useState(false);
    const [certificates, setCertificates] = useState([] as PortalApisSslCertificateDetails[]);
    const [selected, setSelected] = useState<GridRowId[]>();
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const { data: session, status } = useSession();

    const handleClose = () => {
        setSelected(undefined);
        setOpen(false);
    };

    function revoke() {
        const item = selected;
        if (session && item) {
            const cert = certificates.find((cert) => cert.serial === selected.at(0));
            if (cert?.serial) {
                const cfg = new Configuration({ accessToken: session.accessToken });
                const api = new SSLApi(cfg, `${Config.PKI_HOST}`);
                api.sslRevokePost({ serial: cert?.serial, reason: (reason.current?.value as string) }).then(() => {
                    load();
                    setSelected(undefined);
                    setOpen(false);
                }).catch((error) => {
                    Sentry.captureException(error);
                    setError(true);
                    return;
                });
            }
        }
    }

    function load() {
        if (status == "authenticated") {
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SSLApi(cfg, `${Config.PKI_HOST}`);
            api.sslGet().then((response) => {
                if (response.data) {
                    const data = [];
                    for (const cert of response.data) {
                        if (cert.serial) {
                            data.push({
                                common_name: cert.common_name,
                                expires: cert.expires,
                                serial: cert.serial,
                                not_before: cert.not_before,
                                status: cert.status,
                                subject_alternative_names: cert.subject_alternative_names,
                                created: cert.created,
                                source: cert.source,
                                issued_by: cert.issued_by,
                            });
                        }
                    }
                    setCertificates(data);
                }
                setLoading(false);
            }).catch((error) => {
                Sentry.captureException(error);
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

    const columns: GridColDef[] = [

        { field: "common_name", headerName: "Common Name", width: 250 },
        { field: "serial", headerName: "Serial Number", width: 280 },
        {
            field: "status", width: 100, type: "string", headerName: "Status",
            valueGetter: (params) => {
                if (params.value === "Unmanaged") {
                    return "Issued";
                }

                return params.value as string;
            },
        },
        { field: "issued_by", headerName: "Angefordert durch", width: 150 },
        { field: "source", headerName: "Quelle", width: 150 },
        {
            field: "created", headerName: "Erstellt", type: "dateTime", width: 150,
            valueGetter: ({ value }) => {
                if (value) {
                    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                    const mili = (value.seconds as number) * 1000;
                    return value && new Date(mili);
                }
                return undefined;
            },
        },
        {
            field: "not_before", headerName: "Gültig ab", type: "date", width: 100,
            valueGetter: ({ value }) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (value.seconds as number) * 1000;
                return value && new Date(mili);
            },
        },
        {
            field: "expires", headerName: "Gültig bis", type: "date", width: 100,
            valueGetter: ({ value }) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (value.seconds as number) * 1000;
                return value && new Date(mili);
            },
        },
        {
            field: "subject_alternative_names", headerName: "Subject Alternative Names", flex: 1,
            minWidth: 250,
        }, {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {

                const row = (params.row as PortalApisSslCertificateDetails);

                return <Button variant="outlined" disabled={row.status == "Revoked"} onClick={(event: FormEvent<Element>) => {
                    event.preventDefault();
                    setSelected([params.id]);
                    setOpen(true);
                }} sx={{ px: 1, mx: 1 }} color="warning" startIcon={<DeleteIcon />} key="revoke"> Widerrufen</Button>;
            },
        },
    ];

    const selection = function () {
        if (selected && selected.length > 0) {
            const cert = certificates.find((cert) => cert.serial === selected.at(0));
            return <Box sx={{ px: 1, py: 1 }}>
                <table>
                    <tbody>
                        <tr>
                            <td><b>Common Name</b></td>
                            <td>{cert?.common_name}</td>
                        </tr>
                        <tr style={{ verticalAlign: "baseline" }}>
                            <td><b>Subject Alternative Names</b></td>
                            <td><ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>{cert?.subject_alternative_names?.map(x => <li>{x}</li>)}</ul></td>
                        </tr>
                        <tr>
                            <td><b>Serial</b></td>
                            <td>{cert?.serial}</td>
                        </tr>
                        <tr>
                            <td><b>Gültig ab</b></td>
                            <td>{cert?.not_before?.seconds && <Moment format="DD.MM.YYYY" date={new Date(cert?.not_before?.seconds * 1000)}></Moment>}</td>
                        </tr>
                        <tr>
                            <td><b>Gültig bis</b></td>
                            <td>{cert?.expires?.seconds && <Moment format="DD.MM.YYYY" date={new Date(cert?.expires?.seconds * 1000)}></Moment>}</td>
                        </tr>
                        <tr>
                            <td><b>Erstellt</b></td>
                            <td>{cert?.created?.seconds && <Moment format="DD.MM.YYYY HH:mm" date={new Date(cert?.created?.seconds * 1000)}></Moment>}</td>
                        </tr>
                        <tr>
                            <td><b>Nutzer</b></td>
                            <td>{cert?.issued_by}</td>
                        </tr>
                        <tr>
                            <td><b>Verfahren</b></td>
                            <td>{cert?.source}</td>
                        </tr>

                    </tbody>
                </table>
            </Box >;
        } else {
            return undefined;
        }
    };
    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Serverzertifikate</Typography>
        <DataGrid columns={columns}
            pageSize={pageSize}
            sx={dataGridStyle}
            getRowId={(row) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  
                row.serial
            }
            initialState={{
                columns: {
                    columnVisibilityModel: {
                        issued_by: false,
                        source: false,
                    },
                },
                sorting: {
                    sortModel: [{ field: "created", sort: "desc" }],
                },
            }}
            onSelectionModelChange={(event) => { setSelected(event); }}
            selectionModel={selected}
            components={{ LoadingOverlay: LinearProgress }}
            localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText, errorOverlayDefaultLabel: typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten." }}
            componentsProps={{ loadingOverlay: { color: "inherit" } }}
            loading={loading}
            error={error}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
        {selection()}
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>SSL Zertifikat widerrufen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten das SSL Zertifikat mit Seriennummer {selected && certificates.find((cert) => cert.serial === selected.at(0))?.serial}  widerrufen.

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
                <Button key="cancel" variant="outlined" color="inherit" onClick={handleClose}>Abbrechen</Button>
                <Button key="revoke" variant="outlined" color="warning" onClick={() => revoke()}>Widerrufen</Button>
            </DialogActions>
        </Dialog>
        <Box sx={{ display: "flex", flexDirection: "row", gap: "6px", width: "100%", justifyContent: "space-between" }}>
            <Link legacyBehavior={true} href="/server/new"><Button variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, width: "80%" }} >Neues Zertifikat mit Assistent erstellen</Button></Link>
            <Link legacyBehavior={true} href="/server/csr"><Button variant="contained" disabled={!session} color="success" startIcon={<UploadFileIcon />} sx={{ mt: 1, width: "20%" }} >Eigenen CSR verwenden</Button></Link>
        </Box>

    </Box>;
}