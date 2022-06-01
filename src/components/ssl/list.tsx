import { AuthenticationResult } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PortalApisSslCertificateDetails, SSLApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";

export default function SslCertificates() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    const navigation = useNavigate();

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [loading, setLoading] = React.useState(true);
    const [certificates, setCertificates] = useState([] as PortalApisSslCertificateDetails[]);
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
            field: "status", width: 150, type: "string", headerName: "Status",
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
            field: "created", headerName: "Erstellt", type: "dateTime", width: 150,
            valueGetter: ({ value }) => {
                if (value) {
                    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  */
                    const mili = (value.seconds as number) * 1000;
                    if (!mili) {
                        console.log(value);
                    }
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
                if (!mili) {
                    console.log(value);
                }
                return value && new Date(mili);
            },
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
        },
        { field: "subject_alternative_names", headerName: "Subject Alternative Names", width: 380 },
    ];

    return <div><h1>Ihre Zertifikate</h1>
        <DataGrid autoHeight columns={columns}
            pageSize={pageSize}
            getRowId={(row) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access  
                row.serial
            }
            initialState={{
                sorting: {
                    sortModel: [{ field: "created", sort: "desc" }],
                },
            }}
            loading={loading}
            error={error}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
        <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigation("/ssl/new")}>Neues Zertifikat beziehen</Button>
    </div>;
}
