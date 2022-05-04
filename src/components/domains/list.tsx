import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useState } from "react";

import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { Config } from "../../config";

function manageable(domain: ModelDomain, domains: ModelDomain[]) {
    for (const d of domains) {
        if (d.approved) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (domain.fqdn?.endsWith("." + d.fqdn!)) {
                return true;
            }
        }
    }
    return false;
}

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

export default function Domains() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);
    useEffect(() => { if (account) { loadDomains(account, instance, setDomains); } }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }

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
            renderCell: (params) => {
                const row = (params.row as ModelDomain);
                const buttons = [];
                if (!row.approved && manageable(row, domains)) {
                    const approve = useCallback((event: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        event.preventDefault();
                        approveDomain(row.id!, account!, instance, setDomains);
                    }, [account, instance]);
                    buttons.push(<Button color="secondary" variant="outlined" onClick={approve}>Freischalten</Button>);
                }
                if (manageable(row, domains)) {
                    const remove = useCallback((event: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        event.preventDefault(); removeDomain(row.id!, account!, instance, setDomains);
                    }, [account, instance]);
                    buttons.push(<Button color="secondary" variant="outlined" onClick={remove}>Löschen</Button>);
                }
                return <>{buttons}</>;

            },
        },
    ];

    return <div><h1>Ihre Domains</h1>
        <DataGrid autoHeight columns={columns}
            pageSize={pageSize}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={domains}></DataGrid>
    </div>;
}
