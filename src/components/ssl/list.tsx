import { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

import { PortalApisSslCertificateDetails, SSLApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { Config } from "../../config";
export function authorizeSsl(account: AccountInfo, instance: IPublicClientApplication, handler: (response: AuthenticationResult) => void) {
    instance.acquireTokenSilent({
        scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"],
        account: account,
    }).then(handler).catch((error) => {
        console.log(error);
        instance.acquireTokenPopup({
            scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"],
            account: account,
        }).then(handler).catch((error) => {
            console.log(error);
        });
    });
}
export default function SslCertificates() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [loading, setLoading] = React.useState(true);
    const [certificates, setCertificates] = useState([] as PortalApisSslCertificateDetails[]);

    useEffect(() => {
        if (isAuthenticated && account) {
            authorizeSsl(account, instance, (response: AuthenticationResult) => {
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
                                    notBefore: cert.notBefore,
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
            });

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
            field: "notBefore", headerName: "Gültig ab", type: "date", width: 150,
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
                    sortModel: [{ field: "notBefore", sort: "desc" }],
                },
            }}
            loading={loading}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
    </div>;
}
