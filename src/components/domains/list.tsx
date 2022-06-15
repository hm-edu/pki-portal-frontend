/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, Button, TextField, TextFieldProps } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { Config } from "../../config";
import { authorize } from "../../auth/api";
import Delegation from "./delegation";

function removeDomain(id: number, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsIdDelete(id).then(() => {
                loadDomains(account, instance, setDomains, setError);
            }).catch(() => {
                setError(true);
            });
        }
    }, () => {
        setError(true);
    });
}
function approveDomain(id: number, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsIdApprovePost(id).then(() => {
                loadDomains(account, instance, setDomains, setError);
            }).catch(() => {
                setError(true);
            });
        }
    }, () => {
        setError(true);
    });
}

function loadDomains(account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsGet().then((response) => {
                setDomains(response.data);
            }).catch(() => {
                setError(true);
            });
        }
    }, () => {
        setError(true);
    });
}

function createDomain(domain: string, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsPost({ fqdn: domain }).then(() => {
                loadDomains(account, instance, setDomains, setError);
            }).catch((error) => {
                console.log(error);
            });
        }
    }, () => {
        setError(true);
    });
}

export default function Domains() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);
    const [loading, setLoading] = useState(true);
    const [delegation, setDelegation] = useState(false);
    const [delegationDomain, setDelegationDomain] = useState<ModelDomain>();
    const [error, setError] = useState<undefined | boolean>(undefined);

    const newDomain = useRef<TextFieldProps>(null);

    useEffect(() => {
        if (isAuthenticated && account) {
            loadDomains(account, instance, (domains: ModelDomain[]) => { setDomains(domains); setLoading(false); }, () => { setError(true); setLoading(false); });
        }
    }, [account, instance]);

    const create = useCallback((event: FormEvent<Element>) => {
        event.preventDefault();
        if (account) {
            createDomain(newDomain.current?.value as string, account, instance, setDomains, setError);
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

                const approve = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                    approveDomain(row.id!, account!, instance, setDomains, setError);
                }, [account, instance]);
                const remove = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                    removeDomain(row.id!, account!, instance, setDomains, setError);
                }, [account, instance]);
                const openDelegation = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                    setDelegation(true);
                    setDelegationDomain(row);
                }, [delegation]);
                const transfer = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                }, [account, instance]);
                buttons.push(<Button color="success" disabled={!row.permissions?.can_approve} sx={{ px: 1, mx: 1 }} variant="contained" onClick={approve}>Freischalten</Button>);
                buttons.push(<Button color="warning" disabled={!row.permissions?.can_delete} sx={{ px: 1, mx: 1 }} variant="contained" onClick={remove}><DeleteIcon /> Löschen</Button>);
                buttons.push(<Button color="primary" disabled={!row.permissions?.can_delegate} sx={{ px: 1, mx: 1 }} variant="contained" onClick={openDelegation}>Delegationen bearbeiten</Button>);
                buttons.push(<Button color="primary" disabled={!row.permissions?.can_transfer} sx={{ px: 1, mx: 1 }} variant="contained" onClick={transfer}>Zuständigkeit übertragen</Button>);

                return <Box sx={{ display: "flex" }}>{buttons}</Box>;

            },
        },
    ];

    let delegationModal;
    if (delegationDomain) {
        delegationModal = <Delegation delegationDomain={delegationDomain} onClose={(domain: ModelDomain) => {            
            const updated: ModelDomain[] = [...domains];
            updated[updated.findIndex((x) => x.id == delegationDomain.id)].delegations = domain.delegations;
            setDomains(updated);
            setDelegation(false);
            setDelegationDomain(undefined);
        }} />;
    }
    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><h1>Ihre Domains</h1>
        <DataGrid columns={columns}
            pageSize={pageSize}
            loading={loading}
            error={error}
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
        {delegationModal}
    </Box>;
}
