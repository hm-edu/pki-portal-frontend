import { useAccount, useMsal } from "@azure/msal-react";
import React, { useEffect, useState } from "react";

import { DomainsApi } from "../api/domains/api";
import { ModelDomain } from "../api/domains/api";
import { Configuration } from "../api/domains/configuration";
import { Config } from "../config";

export default function Domains() {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});

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

    if (accounts.length > 0) {
        const rows = [];
        for (let i = 0; i < domains.length; i++) {
            rows.push(
                <tr key={i}>
                    <td>{domains[i].fqdn}</td>
                    <td>{(domains[i].approved) ? "Ja" : "Nein"}</td>
                </tr>);
        }
        return <div><h1>Ihre Domains</h1><table><thead><tr><td>FQDN</td><td>Bestätigt?</td></tr></thead>
            <tbody>
                {rows}
            </tbody>
        </table></div>;
    } else if (inProgress === "login") {
        return <span>Login is currently in progress!</span>;
    } else {
        return <span>There are currently no users signed in!</span>;
    }
}
