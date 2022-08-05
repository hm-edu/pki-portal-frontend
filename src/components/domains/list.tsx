/* eslint-disable @typescript-eslint/no-non-null-assertion */
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import LinearProgress from "@mui/material/LinearProgress";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { green } from "@mui/material/colors";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { Config } from "../../config";
import { authorize } from "../../auth/api";
import Delegation from "./delegation";
import { Typography } from "@mui/material";

function removeDomain(id: number, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
    return new Promise(function (resolve, reject) {
        authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
            if (response) {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
                api.domainsIdDelete(id).then(() => {
                    loadDomains(account, instance, setDomains, setError);
                    resolve(undefined);
                }).catch(() => {
                    setError(true);
                    reject(undefined);
                });
            }
        }, () => {
            setError(true);
            reject(undefined);
        });
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

function createDomain(domain: string, account: AccountInfo, instance: IPublicClientApplication, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void): Promise<boolean> {
    return new Promise(function (resolve, reject) {
        authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
            if (response) {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
                api.domainsPost({ fqdn: domain }).then(() => {
                    loadDomains(account, instance, setDomains, setError);
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            }
        }, (err) => {
            setError(true);
            reject(err);
        });
    });
}

export default function Domains() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [open, setOpen] = useState(false);
    const [delegation, setDelegation] = useState(false);
    const [selected, setSelected] = useState<ModelDomain>();
    const [delegationDomain, setDelegationDomain] = useState<ModelDomain>();
    const [error, setError] = useState<undefined | boolean>(undefined);
    const newDomain = useRef<TextFieldProps>(null);

    const handleDeleteClose = () => {
        if (deleting)
            return;
        setSelected(undefined);
        setOpen(false);
    };

    useEffect(() => {
        if (isAuthenticated && account) {
            loadDomains(account, instance, (domains: ModelDomain[]) => { setDomains(domains); setLoading(false); }, () => { setError(true); setLoading(false); });
        }
    }, [account, instance]);

    const create = useCallback((event: FormEvent<Element>) => {
        event.preventDefault();
        if (account && newDomain.current) {
            void createDomain(newDomain.current.value as string, account, instance, setDomains, setError).then(() => newDomain.current!.value = "");
        }
    }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }

    const columns: GridColDef[] = [
        { field: "fqdn", headerName: "FQDN", width: 280 },
        { field: "owner", headerName: "Inhaber", width: 280 },
        { field: "approved", headerName: "Bestätigt", width: 90, type: "boolean" },
        {
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
                    setOpen(true);
                    setSelected(row);
                }, [account, instance]);
                const openDelegation = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                    setDelegation(true);
                    setDelegationDomain(row);
                }, [delegation]);
                const transfer = useCallback((event: FormEvent<Element>) => {
                    event.preventDefault();
                }, [account, instance]);
                buttons.push(<Button color="success" disabled={!row.permissions?.can_approve} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={approve}>Freischalten</Button>);
                buttons.push(<Button color="warning" disabled={!row.permissions?.can_delete} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={remove} startIcon={<DeleteIcon />}>Löschen</Button>);
                buttons.push(<Button color="inherit" disabled={!row.permissions?.can_delegate} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={openDelegation}>Delegationen bearbeiten</Button>);
                buttons.push(<Button color="inherit" disabled={!row.permissions?.can_transfer} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={transfer}>Zuständigkeit übertragen</Button>);

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

    let deleteDialog;
    if (selected) {
        deleteDialog = <Dialog open={open} onClose={handleDeleteClose}>
            <DialogTitle>Domain löschen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten die Domain {selected?.fqdn} löschen.
                    <Alert severity="warning">Diese Löschung wird automatisch alle zugeordnten Zertifikate widerrufen.</Alert>
                    Möchten Sie wirklich fortfahren?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" color="inherit" disabled={deleting} onClick={handleDeleteClose}>Abbrechen</Button>
                <Button variant="outlined" color="warning" disabled={deleting} onClick={() => {
                    setDeleting(true);

                    void removeDomain(selected.id!, account!, instance, setDomains, setError).then(() => {
                        setDeleting(false);
                        handleDeleteClose();
                    });
                }}>Löschen {(deleting && <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />)}</Button>
            </DialogActions>
        </Dialog>;
    }

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><h1>Ihre Domains</h1>
        <DataGrid
            initialState={{
                sorting: {
                    sortModel: [{ field: "fqdn", sort: "asc" }],
                },
            }}
            columns={columns}
            pageSize={pageSize}
            components={{
                LoadingOverlay: LinearProgress,
            }}
            componentsProps={{ loadingOverlay: { color: "inherit" } }}
            loading={loading}
            error={error}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={domains}></DataGrid>

        <Box component="form" onSubmit={create}
            sx={{
                display: "flex",
                flexDirection: "column",
            }}>
            <TextField required
                label="Neue Domain"
                inputRef={newDomain}
                variant="standard" />

            <Button type="submit" variant="contained" color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} >Erstelle Domain</Button>
        </Box>
        {deleteDialog}
        {delegationModal}
    </Box>;
}
