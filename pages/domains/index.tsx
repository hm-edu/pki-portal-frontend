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
import { deDE } from "@mui/x-data-grid";

import React, { FormEvent, useEffect, useRef, useState } from "react";

import { DomainsApi } from "../../api/domains/api";
import { ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { AuthProps, Config } from "../../src/config";
import Delegation from "../../src/delegation";
import { getServerSideProps } from "../../src/auth";
import { dataGridStyle } from "../../src/theme";
import { Typography } from "@mui/material";

export default Domains;

export function Domains({ session, nonce }: { session: AuthProps | null; nonce: string }) {
    const [pageSize, setPageSize] = useState<number>(15);
    const [domains, setDomains] = useState([] as ModelDomain[]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<ModelDomain>();
    const [delegationDomain, setDelegationDomain] = useState<ModelDomain>();
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const newDomain = useRef<TextFieldProps>(null);

    const handleDeleteClose = () => {
        if (deleting)
            return;
        setSelected(undefined);
        setOpen(false);
    };

    useEffect(() => {
        if (session) {
            loadDomains((domains: ModelDomain[]) => { setDomains(domains); setLoading(false); }, () => { setError(true); setLoading(false); });
        } else {
            setLoading(false);
            setDomains([]);
            setError("Bitte melden Sie sich an!");
        }
    }, [session]);

    const create = (event: FormEvent<Element>) => {
        event.preventDefault();
        if (session) {
            void createDomain(newDomain.current!.value as string, setDomains, setError).then(() => newDomain.current!.value = "");
        }
    };

    function removeDomain(id: number, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        return new Promise(function (resolve, reject) {
            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
            api.domainsIdDelete(id).then(() => {
                loadDomains(setDomains, setError);
                resolve(undefined);
            }).catch(() => {
                setError(true);
                reject(undefined);
            });

        });
    }

    function approveDomain(id: number, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
        api.domainsIdApprovePost(id).then(() => {
            loadDomains(setDomains, setError);
        }).catch(() => {
            setError(true);
        });
    }

    function loadDomains(setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
        api.domainsGet().then((response) => {
            setDomains(response.data);
        }).catch(() => {
            setError(true);
        });
    }

    function createDomain(domain: string, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void): Promise<boolean> {
        return new Promise(function (resolve, reject) {
            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
            api.domainsPost({ fqdn: domain }).then(() => {
                loadDomains(setDomains, setError);
                resolve(true);
            }).catch((error) => {
                reject(error);
            });
        });
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
            minWidth: 500,
            renderCell: (params) => {
                const row = (params.row as ModelDomain);
                const buttons = [];

                const approve = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    approveDomain(row.id!, setDomains, setError);
                };

                const remove = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setOpen(true);
                    setSelected(row);
                };

                const openDelegation = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setDelegationDomain(row);
                };

                const transfer = (event: FormEvent<Element>) => {
                    event.preventDefault();
                };

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
        delegationModal = <Delegation delegationDomain={delegationDomain} nonce={nonce} onClose={(domain: ModelDomain) => {
            const updated: ModelDomain[] = [...domains];
            updated[updated.findIndex((x) => x.id == delegationDomain.id)].delegations = domain.delegations;
            setDomains(updated);
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
                    void removeDomain(selected.id!, setDomains, setError).then(() => {
                        setDeleting(false);
                        handleDeleteClose();
                    });
                }}>Löschen {(deleting && <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />)}</Button>
            </DialogActions>
        </Dialog>;
    }

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Domains</Typography>
        <DataGrid
            initialState={{
                sorting: {
                    sortModel: [{ field: "fqdn", sort: "asc" }],
                },
            }}
            nonce={nonce}
            sx={dataGridStyle}
            columns={columns}
            pageSize={pageSize}
            components={{
                LoadingOverlay: LinearProgress,
            }}
            componentsProps={{ loadingOverlay: { color: "inherit" } }}
            loading={loading}
            localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText, errorOverlayDefaultLabel: typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten." }}
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
            <Button type="submit" variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} >Erstelle Domain</Button>
        </Box>
        {deleteDialog}
        {delegationModal}
    </Box>;
}

export { getServerSideProps };