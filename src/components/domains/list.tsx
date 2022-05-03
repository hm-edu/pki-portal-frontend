import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { Config } from "../../config";

export default function Domains() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);

    useEffect(() => {
        if (account) {
            instance.acquireTokenSilent({
                scopes: ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"],
                account: account,
            }).then((response) => {
                if (response) {
                    console.log(response.accessToken);
                    const cfg = new Configuration({ accessToken: response.accessToken });
                    const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
                    api.domainsGet().then((response) => {
                        console.log(response);
                        setDomains(response.data);
                    }).catch((error) => {
                        console.error(error);
                    });
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    }, [account, instance]);
    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }

    const columns: GridColDef[] = [
        { field: "fqdn", headerName: "FQDN", width: 280 },
        { field: "owner", headerName: "Inhaber", width: 280 },
        {
            field: "approved", headerName: "Bestätigt", width: 90,
            type: "boolean",
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
