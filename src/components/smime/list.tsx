import { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PortalApisListSmimeResponseCertificateDetails, SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { Config } from "../../config";

export function authorizeSmime(account: AccountInfo, instance: IPublicClientApplication, handler: (response: AuthenticationResult) => void) {
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
function revoke() {
    // Todo
}

export default function SmimeCertificates() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [loading, setLoading] = React.useState(true);
    const [certificates, setCertificates] = useState([] as PortalApisListSmimeResponseCertificateDetails[]);

    useEffect(() => {
        if (account) {
            authorizeSmime(account, instance, (response: AuthenticationResult) => {
                if (response) {
                    const cfg = new Configuration({ accessToken: response.accessToken });
                    const api = new SMIMEApi(cfg, `https://${Config.PKI_HOST}`);
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
            });
        }
    }, [account, instance]);

    if (!isAuthenticated) {
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
            renderCell: (params) => {
                const row = (params.row as PortalApisListSmimeResponseCertificateDetails);
                const buttons = [];
                if (row.status !== "revoked") {
                    buttons.push(<Button variant="outlined" onClick={revoke} color="secondary" key="revoke">Revoke</Button>);
                }
                return <>{buttons}</>;
            },
        },
    ];

    const navigation = useNavigate();
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
        <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigation("/smime/new")}>Neues Zertifikat beziehen</Button>
    </div>;
}
