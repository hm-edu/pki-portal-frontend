"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef, GridPaginationModel, GridRenderCellParams, GridRowSelectionModel, GridSlots, GridTreeNodeWithRender } from "@mui/x-data-grid";
import { deDE } from "@mui/x-data-grid/locales";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

import { PortalApisSslCertificateDetails, SSLApi } from "@/api/pki/api";
import { Configuration } from "@/api/pki/configuration";
import CertificateDetails from "@/app/server/CertificateDetails";
import CertificateRevokeDialog from "@/app/server/CertificateRevokeDialog";
import { Config } from "@/components/config";
import { dataGridStyle } from "@/components/theme";
import { QuickSearchToolbar } from "@/components/toolbar";

enum CA {
    HARICA = "HARICA",
    SECTIGO = "Sectigo",
}

export default function SslCertificates() {
    const [pageModel, setPageModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
    const [loading, setLoading] = useState(true);
    const [revokeOpen, setRevokeOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [certificates, setCertificates] = useState([] as PortalApisSslCertificateDetails[]);
    const [selected, setSelected] = useState<GridRowSelectionModel>();
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const { data: session, status } = useSession();

    const handleClose = () => {
        setSelected(undefined);
        setRevokeOpen(false);
    };

    function revoke(reason: string) {
        const item = selected;
        if (session && item) {
            const cert = certificates.find((cert) => cert.serial === Array.from(selected.ids).at(0));
            Sentry.startSpan({ name: "Revoke Certificate" }, async () => {
                if (cert?.serial) {
                    const cfg = new Configuration({
                        accessToken: session.accessToken,
                    });
                    const api = new SSLApi(cfg, `${Config.PkiHost}`);
                    try {
                        await api.sslRevokePost({ serial: cert?.serial, reason: reason });
                        load();
                        setSelected(undefined);
                        setRevokeOpen(false);
                    } catch (error) {
                        Sentry.captureException(error);
                        setError(true);
                    }
                }
            }).catch((error) => {
                Sentry.captureException(error);
            });
        }
    }

    function mapCert(cert: PortalApisSslCertificateDetails): PortalApisSslCertificateDetails {
        let ca = cert.ca;
        switch (cert.ca) {
            case "harica":
                ca = CA.HARICA;
                break;
            case "sectigo":
                ca = CA.SECTIGO;
                break;
        }

        return {
            common_name: cert.common_name,
            expires: cert.expires,
            serial: cert.serial,
            not_before: cert.not_before,
            status: cert.status,
            subject_alternative_names: cert.subject_alternative_names,
            created: cert.created,
            source: cert.source,
            issued_by: cert.issued_by,
            ca: ca,
        };
    }

    function load() {
        if (status == "authenticated") {
            Sentry.setUser({ email: session?.user?.email ?? "" });
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new SSLApi(cfg, `${Config.PkiHost}`);
            Sentry.startSpan({ name: "Load Certificates" }, async () => {
                try {
                    const response = await api.sslGet();
                    if (response.data) {
                        const data = [];
                        for (const cert of response.data) {
                            if (cert.serial) {
                                data.push(mapCert(cert));
                            }
                        }
                        setCertificates(data);
                    }
                    setLoading(false);
                } catch (error) {
                    Sentry.captureException(error);
                    setError(true);
                }
            }).catch((error) => {
                Sentry.captureException(error);
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
            valueGetter: (value) => {
                if (value === "Unmanaged") {
                    return "Issued";
                }

                return value as string;
            },
        },
        { field: "issued_by", headerName: "Angefordert durch", width: 150 },
        { field: "source", headerName: "Quelle", width: 150 },
        { field: "ca", headerName: "Verwendete CA", width: 150 },
        {
            field: "created", headerName: "Erstellt", type: "dateTime", width: 150,
            valueGetter: (value, row) => {
                if (value) {
                    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                    const mili = (row.created.seconds as number) * 1000;
                    return value && new Date(mili);
                }
                return undefined;
            },
        },
        {
            field: "not_before", headerName: "Gültig ab", type: "date", width: 100,
            valueGetter: (value, row) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (row.not_before.seconds as number) * 1000;
                return value && new Date(mili);
            },
        },
        {
            field: "expires", headerName: "Gültig bis", type: "date", width: 100,
            valueGetter: (value, row) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (row.expires.seconds as number) * 1000;
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
            minWidth: 260,
            renderCell: (params) => {

                const row = (params.row as PortalApisSslCertificateDetails);

                return <Box>
                    <Button variant="outlined" disabled={row.status == "Revoked" || row.ca == CA.SECTIGO} onClick={(event: FormEvent<Element>) => {
                        event.preventDefault();
                        setSelected({ ids: new Set([params.id]), type: "include" });
                        setRevokeOpen(true);
                    }} sx={{ px: 1, mx: 1 }} color="warning" startIcon={<DeleteIcon />} key="revoke">
                        Widerrufen
                    </Button>
                    <Button variant="outlined" color="inherit" startIcon={<InfoIcon />} onClick={(e) => openDetails(e, params)}>Details</Button>
                </Box>;
            },
        },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openDetails = function (event: FormEvent<Element>, params: GridRenderCellParams<any, any, any, GridTreeNodeWithRender>) {
        event.preventDefault();
        setSelected({ ids: new Set([params.id]), type: "include" });
        setDetailsOpen(true);
    };

    const selection = function () {
        if (selected && selected.ids.size > 0 && detailsOpen) {
            const cert = certificates.find((cert) => cert.serial === Array.from(selected.ids).at(0));
            if (cert) {
                return <CertificateDetails cert={cert} open={detailsOpen} onClose={() => (setDetailsOpen(false))} />;
            }
        }
        return <></>;
    };

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Serverzertifikate</Typography>
        {(error && <Alert severity="error">{typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten."}</Alert>) || <>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <DataGrid columns={columns}
                    paginationModel={pageModel}
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
                                ca: false,
                            },
                        },
                        sorting: {
                            sortModel: [{ field: "created", sort: "desc" }],
                        },
                    }}
                    onRowSelectionModelChange={(event) => { setSelected(event); }}
                    rowSelectionModel={selected}
                    showToolbar
                    slots={{
                        loadingOverlay: LinearProgress as GridSlots["loadingOverlay"],
                        toolbar: QuickSearchToolbar,
                    }}
                    localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                    slotProps={{ loadingOverlay: { color: "inherit" } }}
                    loading={loading}
                    onPaginationModelChange={(newPageModel) => setPageModel(newPageModel)}
                    pageSizeOptions={[5, 15, 25, 50, 100]}
                    pagination rows={certificates}></DataGrid>
            </div>
            <Box sx={{ display: "flex", flexDirection: "row", gap: "6px", width: "100%", justifyContent: "space-between" }}>
                <Link href="/server/new" style={{width: "80%"}}><Button variant="contained" id="newServer" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{mt: 1, width:1}}>Neues Zertifikat mit Assistent erstellen</Button></Link>
                <Link href="/server/csr" style={{width: "20%"}}><Button variant="contained" id="newServerCsr" disabled={!session} color="success" startIcon={<UploadFileIcon />} sx={{ mt: 1, width:1 }} >Eigenen CSR verwenden</Button></Link>
            </Box>
        </>}
        {selection()}
        <CertificateRevokeDialog open={revokeOpen} onClose={handleClose} onRevoke={revoke} certificates={certificates} selected={selected} />
    </Box>;
}
