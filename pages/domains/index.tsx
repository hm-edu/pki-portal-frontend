/* eslint-disable @typescript-eslint/no-non-null-assertion */
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
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
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import * as Sentry from "@sentry/nextjs";

import { useSession } from "next-auth/react";
import isValidDomain from "is-valid-domain";

import { FormEvent, useEffect, useRef, useState } from "react";
import { DomainsApi } from "@/api/domains/api";
import { ModelDomain } from "@/api/domains/api";
import { Configuration } from "@/api/domains/configuration";
import { Config } from "@/components/config";
import Delegation from "@/components/delegation";
import { dataGridStyle } from "@/components/theme";
import { QuickSearchToolbar } from "@/components/toolbar";
import { PortalApisSslCertificateDetails, SSLApi } from "@/api/pki/api";

export default function Domains() {
    const [pageModel, setPageModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
    const [domains, setDomains] = useState([] as ModelDomain[]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<ModelDomain>();
    const [delegationDomain, setDelegationDomain] = useState<ModelDomain>();
    const [transferDomain, setTransferDomain] = useState<ModelDomain>();
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const [createError, setCreateError] = useState<undefined | string | React.JSX.Element>(undefined);
    const [dnsRunning, setDnsRunning] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<PortalApisSslCertificateDetails[]>([]);

    const newDomain = useRef<TextFieldProps>(null);
    const target = useRef<TextFieldProps>(null);

    const { data: session, status } = useSession();

    const handleDeleteClose = () => {
        if (deleting)
            return;
        setSelected(undefined);
        setDeleteOpen(false);
    };

    useEffect(() => {
        if (status == "authenticated") {
            loadDomains((domains: ModelDomain[]) => { setDomains(domains); setLoading(false); }, () => { setError(true); setLoading(false); });
        } else if (status == "unauthenticated") {
            setLoading(false);
            setDomains([]);
            setError("Bitte melden Sie sich an!");
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const create = (event: FormEvent<Element>) => {
        event.preventDefault();
        setCreateError(undefined);
        const fqdn = newDomain.current!.value as string;
        if (!isValidDomain(fqdn)) {
            setCreateError("Bitte geben Sie einen gültigen Domainnamen ein!");
            return;
        }
        setDnsRunning(true);
        void fetch("/api/dns", { method: "POST", body: JSON.stringify({ fqdn: fqdn }) }).then((response) => {
            setDnsRunning(false);
            if (!response.ok) {
                setCreateError(<Stack>Die angegebene Domain existiert nicht im DNS.
                    <Button color="warning" variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} onClick={() => {
                        void createDomain(newDomain.current!.value as string, setDomains, setError).then(() => newDomain.current!.value = "").then(() => setCreateError(undefined));
                    }}>
                        Dennoch anlegen!
                    </Button>
                </Stack>);
            } else {
                void createDomain(newDomain.current!.value as string, setDomains, setError).then(() => newDomain.current!.value = "");
            }
        });
    };

    const transfer = (event: FormEvent<Element>) => {
        event.preventDefault();
        if (session && transferDomain && transferDomain.id && target.current) {

            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DomainHost}`);
            api.domainsIdTransferPost(transferDomain?.id, { owner: target.current?.value as string }).then(() => {
                loadDomains(setDomains, setError); setTransferDomain(undefined);
            }).catch((error) => {
                Sentry.captureException(error);
                setError(true);
                setTransferDomain(undefined);
            });
        }
    };

    function removeDomain(id: number, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        return new Promise(function (resolve) {
            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DomainHost}`);
            api.domainsIdDelete(id).then(() => {
                loadDomains(setDomains, setError);
                resolve(undefined);
            }).catch((error) => {
                Sentry.captureException(error);
                setError(true);
            });

        });
    }

    function approveDomain(id: number, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        api.domainsIdApprovePost(id).then(() => {
            loadDomains(setDomains, setError);
        }).catch((error) => {
            Sentry.captureException(error);
            setError(true);
        });
    }

    function loadDomains(setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        api.domainsGet().then((response) => {
            setDomains(response.data);
        }).catch((error) => {
            Sentry.captureException(error);
            setError(true);
        });
    }

    function createDomain(domain: string, setDomains: (domains: ModelDomain[]) => void, setError: (error: boolean) => void): Promise<boolean> {
        return new Promise(function (resolve) {
            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DomainHost}`);
            api.domainsPost({ fqdn: domain }).then(() => {
                loadDomains(setDomains, setError);
                resolve(true);
            }).catch((error) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (error.response.status == 400) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (error.response.data.message == "Domain already exists") {
                        setCreateError("Diese Domain existiert bereits! Ein anderer Nutzer hat die Domain angelegt.");
                    }
                } else {
                    Sentry.captureException(error);
                }
            });
        });
    }

    const columns: GridColDef[] = [
        {
            field: "fqdn", headerName: "FQDN", width: 280, sortComparator: (v1, v2) => {
                const a = v1 as string;
                const b = v2 as string;
                return a.split(".").reverse().join(".").localeCompare(b.split(".").reverse().join("."));
            },
        },
        { field: "owner", headerName: "Inhaber", width: 280 },
        { field: "approved", headerName: "Bestätigt", width: 90, type: "boolean" },
        {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            minWidth: 700,
            renderCell: (params) => {
                const row = (params.row as ModelDomain);
                const buttons = [];

                const approve = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    approveDomain(row.id!, setDomains, setError);
                };

                const remove = (event: FormEvent<Element>) => {
                    event.preventDefault();

                    const cfg = new Configuration({
                        accessToken: session?.accessToken,
                    });
                    const api = new SSLApi(cfg, `${Config.PkiHost}`);
                    void api.sslActiveGet(row.fqdn!).then((response) => {
                        setDeleteOpen(true);
                        setSelected(row);
                        setToBeDeleted(response.data);
                    });
                };

                const openDelegation = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setDelegationDomain(row);
                };

                const transfer = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setTransferDomain(row);
                };

                buttons.push(<Button key="approve" color="success" disabled={!row.permissions?.can_approve} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={approve}>Freischalten</Button>);
                buttons.push(<Button key="delete" color="warning" disabled={!row.permissions?.can_delete} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={remove} startIcon={<DeleteIcon />}>Löschen</Button>);
                buttons.push(<Button key="delegate" color="inherit" disabled={!row.permissions?.can_delegate} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={openDelegation}>Delegationen bearbeiten</Button>);
                buttons.push(<Button key="transfer" color="inherit" disabled={!row.permissions?.can_transfer} sx={{ px: 1, mx: 1 }} variant="outlined" onClick={transfer}>Zuständigkeit übertragen</Button>);

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
            setDelegationDomain(undefined);
        }} />;
    }

    let deleteDialog;
    if (selected && deleteOpen) {
        deleteDialog = <Dialog open={deleteOpen} onClose={handleDeleteClose}>
            <DialogTitle>Domain löschen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten die Domain {selected?.fqdn} löschen.
                    {toBeDeleted.length > 0 && <Alert severity="warning">

                        Diese Löschung wird automatisch alle zugeordneten Zertifikate widerrufen.

                        <ul id="toBeRevoked">
                            {toBeDeleted.map((cert) => {
                                return <li key={cert.id}>Serial: {cert.serial}</li>;
                            })}
                        </ul>

                    </Alert>}

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

    let transferDialog;
    if (transferDomain) {
        transferDialog = <Dialog open={true} onClose={() => setTransferDomain(undefined)}>
            <DialogTitle>Host übertragen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sie möchten den Host {transferDomain?.fqdn} an einen anderen Benutzer übertragen.

                    Bitte geben Sie die E-Mail des neuen Nutzers ein.
                </DialogContentText>
                <TextField
                    inputRef={target}
                    autoFocus
                    margin="dense"
                    id="target"
                    label="Neuer Nutzer"
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button key="cancel" variant="outlined" color="inherit" onClick={() => setTransferDomain(undefined)}>Abbrechen</Button>
                <Button key="revoke" variant="outlined" color="warning" onClick={(e) => transfer(e)}>Übertragen</Button>
            </DialogActions>
        </Dialog >;
    }
    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre Hosts</Typography>
        {(error && <Alert severity="error">{typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten."}</Alert>) || <>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <DataGrid
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "fqdn", sort: "asc" }],
                        },
                    }}
                    sx={dataGridStyle}
                    columns={columns}
                    paginationModel={pageModel}
                    slots={{
                        toolbar: QuickSearchToolbar,
                        loadingOverlay: LinearProgress,
                    }}
                    slotProps={{
                        loadingOverlay: { color: "inherit" },
                    }}
                    loading={loading}
                    localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                    onPaginationModelChange={(newPageModel) => setPageModel(newPageModel)}
                    pageSizeOptions={[5, 15, 25, 50, 100]}
                    pagination rows={domains}></DataGrid>
            </div>

            <Box component="form" onSubmit={create}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                }}>
                <TextField required
                    label="Neuer Host"
                    inputRef={newDomain}
                    onChange={() => {
                        setCreateError(undefined);
                        const fqdn = newDomain.current!.value as string;
                        if (domains.map((domain) => {
                            return domain.fqdn;
                        }).includes(fqdn)) {
                            setCreateError("Diese Domain existiert bereits!");
                            return;
                        }
                        if (!isValidDomain(fqdn)) {
                            setCreateError("Bitte geben Sie einen gültigen Domainnamen ein!");
                            return;
                        }
                    } }
                    variant="standard" />
                {createError && <Alert severity="error" sx={{ mt: 1 }}>{createError}</Alert>}
                <Button type="submit" id="new" variant="contained" disabled={!session || dnsRunning || createError != undefined} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} >Erstelle Host {
                    dnsRunning && <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                }</Button>
            </Box>
        </>}
        {deleteDialog}
        {transferDialog}
        {delegationModal}
    </Box>;
}
