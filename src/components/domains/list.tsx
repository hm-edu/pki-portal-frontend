/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, Button, TextField, TextFieldProps } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { Config } from "../../config";

function removeDomain(id: number, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void) {
    instance.acquireTokenSilent({
        scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"],
        account: account,
    }).then((response) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsIdDelete(id).then(() => {
                loadDomains(account, instance, setDomains);
            }).catch((error) => {
                console.log(error);
            });
        }
    }).catch((error) => {
        console.log(error);
    });
}

function approveDomain(id: number, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void) {
    instance.acquireTokenSilent({
        scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"],
        account: account,
    }).then((response) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsIdApprovePost(id).then(() => {
                loadDomains(account, instance, setDomains);
            }).catch((error) => {
                console.log(error);
            });
        }
    }).catch((error) => {
        console.log(error);
    });

}

function loadDomains(account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void) {

    instance.acquireTokenSilent({
        scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"],
        account: account,
    }).then((response) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsGet().then((response) => {
                setDomains(response.data);
            }).catch((error) => {
                console.error(error);
            });
        }
    }).catch((error) => {
        console.log(error);
    });
}

function createDomain(domain: string, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void) {
    instance.acquireTokenSilent({
        scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"],
        account: account,
    }).then((response) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsPost({ fqdn: domain }).then(() => {
                loadDomains(account, instance, setDomains);
            }).catch((error) => {
                console.log(error);
            });
        }
    }).catch((error) => {
        console.log(error);
    });
}

export default function Domains() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }
    const [pageSize, setPageSize] = React.useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);
    const [loading, setLoading] = useState(true);

    const newDomain = useRef<TextFieldProps>(null);

    useEffect(() => { if (account) { loadDomains(account, instance, (domains: ModelDomain[]) => { setDomains(domains); setLoading(false); }); } }, [account, instance]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const create = useCallback((event: any) => {
        event.preventDefault();
        if (account) {
            createDomain(newDomain.current?.value as string, account, instance, setDomains);
        }
    }, [account, instance]);

    const columns: GridColDef[] = [
        { field: "fqdn", headerName: "FQDN", width: 280 },
        { field: "owner", headerName: "Inhaber", width: 280 },
        {
            field: "approved", headerName: "Bestätigt", width: 90,
            type: "boolean",
        }, {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            renderCell: (params) => {
                const row = (params.row as ModelDomain);
                const buttons = [];
                if (row.permissions?.can_approve) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const approve = useCallback((event: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        event.preventDefault();
                        approveDomain(row.id!, account!, instance, setDomains);
                    }, [account, instance]);
                    buttons.push(<Button color="success" sx={{ px: 1, mx: 1 }} variant="outlined" onClick={approve}>Freischalten</Button>);
                }
                if (row.permissions?.can_delete) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const remove = useCallback((event: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        event.preventDefault(); removeDomain(row.id!, account!, instance, setDomains);
                    }, [account, instance]);
                    buttons.push(<Button color="secondary" sx={{ px: 1, mx: 1 }} variant="outlined" onClick={remove}>Löschen</Button>);
                }
                return <Box sx={{ display: "flex" }}>{buttons}</Box>;

            },
        },
    ];

    return <div><h1>Ihre Domains</h1>
        <DataGrid autoHeight columns={columns}
            pageSize={pageSize}
            loading={loading}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={domains}></DataGrid>

        <Box component="form" onSubmit={create}
            sx={{
                maxWidth: "300px",
                display: "flex",
                flexDirection: "column",
            }}>
            <TextField required
                label="Domain"
                inputRef={newDomain}
                variant="standard" />

            <Button type="submit" variant="contained" sx={{ mt: 1 }} >Erstelle Domain</Button>
        </Box>
    </div>;
}
