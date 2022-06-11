import { AuthenticationResult } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import Moment from "react-moment";

import { PortalApisSslCertificateDetails, SSLApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";

export default function SslCertificates() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [loading, setLoading] = React.useState(true);
    const [certificates, setCertificates] = useState([] as PortalApisSslCertificateDetails[]);
    const [selected, setSelected] = useState<GridRowId[]>();
    const [error, setError] = useState<undefined | boolean>(undefined);

    useEffect(() => {
        if (isAuthenticated && account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response: AuthenticationResult) => {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new SSLApi(cfg, `https://${Config.PKI_HOST}`);
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
                    console.error(error);
                });
            }, () => { setError(true); });

        }
    }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }
    const columns: GridColDef[] = [

        { field: "common_name", headerName: "Common Name", width: 280 },
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
        {
            field: "issued_by", headerName: "Angefordert durch", width: 150,
        },
        {
            field: "source", headerName: "Quelle", width: 150,
        },
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
            field: "not_before", headerName: "Gültig ab", type: "date", width: 150,
            valueGetter: ({ value }) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (value.seconds as number) * 1000;
                return value && new Date(mili);
            },
        },
        {
            field: "expires", headerName: "Gültig bis", type: "date", width: 150,
            valueGetter: ({ value }) => {
                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                const mili = (value.seconds as number) * 1000;
                return value && new Date(mili);
            },
        },
        { field: "subject_alternative_names", headerName: "Subject Alternative Names",flex: 1 },
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
    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><h1>Ihre Zertifikate</h1>
        <DataGrid columns={columns}
            pageSize={pageSize}
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
            onSelectionModelChange={(event) => {
                setSelected(event);
            }}
            selectionModel={selected}
            loading={loading}
            error={error}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
        {selection()}

        <Button variant="contained" sx={{ mt: 1 }} href="/ssl/new">Neues Zertifikat beziehen</Button>

    </Box>;
}
