import { AuthenticationResult } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import { PortalApisListSmimeResponseCertificateDetails, SMIMEApi } from "../../api/pki/api";
import { Configuration } from "../../api/pki/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";

export default function SmimeCertificates() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    
    const [pageSize, setPageSize] = React.useState<number>(15);
    const [loading, setLoading] = React.useState(true);
    const [certificates, setCertificates] = useState([] as PortalApisListSmimeResponseCertificateDetails[]);

    function revoke(item: PortalApisListSmimeResponseCertificateDetails) {
        if (isAuthenticated && account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response: AuthenticationResult) => {
                if (response && item.serial) {
                    const cfg = new Configuration({ accessToken: response.accessToken });
                    const api = new SMIMEApi(cfg, `https://${Config.PKI_HOST}`);
                    api.smimeRevokePost({ serial: item.serial, reason: "" }).then(() => {
                        return;
                    }).catch(() => {
                        return;
                    });
                }
            }, () => { return; });
        }
    }
    function load() {
        if (isAuthenticated && account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response: AuthenticationResult) => {
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
            }, () => { setLoading(false); });
        }

    }

    useEffect(() => {
        load();
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
            flex: 1,
            renderCell: (params) => {
                const row = (params.row as PortalApisListSmimeResponseCertificateDetails);
                if (row.status !== "revoked") {
                    return <Button variant="contained" onClick={() => revoke(row)} sx={{ px: 1, mx: 1 }} color="warning" key="revoke"><DeleteIcon /> Revoke</Button>;
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

            loading={loading}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={certificates}></DataGrid>
        <Button variant="contained" sx={{ mt: 1 }} href="/smime/new">Neues Zertifikat beziehen</Button>
    </Box>;
}
