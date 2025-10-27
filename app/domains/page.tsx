"use client";

 
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { AlertTitle } from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { green } from "@mui/material/colors";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSlots } from "@mui/x-data-grid";
import { deDE } from "@mui/x-data-grid/locales";
import * as Sentry from "@sentry/nextjs";
import isValidDomain from "is-valid-domain";
import { useSession } from "next-auth/react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { DomainsApi, type ModelDomain } from "@/api/domains/api";
import { Configuration } from "@/api/domains/configuration";
import { type PortalApisSslCertificateDetails, SSLApi } from "@/api/pki/api";
import { Config } from "@/components/config";
import DelegationModal from "@/components/DelegationModal";
import { dataGridStyle } from "@/components/theme";
import { QuickSearchToolbar } from "@/components/toolbar";

export default function Domains() {
    const [pageModel, setPageModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
    const [domains, setDomains] = useState([] as Array<ModelDomain>);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<ModelDomain>();
    const [delegationDomain, setDelegationDomain] = useState<ModelDomain>();
    const [transferDomain, setTransferDomain] = useState<ModelDomain>();
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const [createError, setCreateError] = useState<undefined | string | React.JSX.Element>(undefined);
    const [dnsRunning, setDnsRunning] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<Array<PortalApisSslCertificateDetails>>([]);

    const newDomain = useRef<TextFieldProps>(null);
    const target = useRef<TextFieldProps>(null);

    const { data: session, status } = useSession();

    const handleDeleteClose = () => {
        if (deleting)
            return;
        setSelected(undefined);
        setDeleteOpen(false);
    };

    async function loadDomains(setDomains: (domains: Array<ModelDomain>) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        await Sentry.startSpan({ name: "Load Domains" }, async () => {
            try {
                const response = await api.domainsGet();
                setDomains(response.data);
            } catch (error) {
                Sentry.captureException(error);
                setError(true);
            }
        });
    }
    
    useEffect(() => {
        if (status == "authenticated") {
            Sentry.setUser({ email: session?.user?.email?? "" });
            void loadDomains((domains: Array<ModelDomain>) => {
                setDomains(domains);
                setLoading(false);
            }, () => {
                setError(true);
                setLoading(false);
            });
        } else if (status == "unauthenticated") {
            setLoading(false);
            setDomains([]);
            setError("Bitte melden Sie sich an!");
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const create = async (event: FormEvent<Element>) => {
        event.preventDefault();
        setCreateError(undefined);
        const fqdn = newDomain.current!.value as string;
        if (!isValidDomain(fqdn)) {
            setCreateError("Bitte geben Sie einen gültigen Domainnamen ein!");
            return;
        }
        setDnsRunning(true);
        const response = await fetch("/api/dns", { method: "POST", body: JSON.stringify({ fqdn: fqdn }) });
        setDnsRunning(false);
        if (!response.ok) {
            setCreateError(<Stack>Die angegebene Domain existiert nicht im DNS.
                <Button color="warning" variant="contained" startIcon={<AddCircleOutlineIcon/>} sx={{ mt: 1 }}
                    onClick={ () =>
                        void (async () => {
                            await createDomain(newDomain.current!.value as string, setDomains, setError);
                            newDomain.current!.value = "";
                            setCreateError(undefined);
                        })()}>
                    Dennoch anlegen!
                </Button>
            </Stack>);
        } else {
            await createDomain(newDomain.current!.value as string, setDomains, setError);
            newDomain.current!.value = "";
        }

    };

    const transfer = async (event: FormEvent<Element>) => {
        event.preventDefault();
        if (session && transferDomain?.id && target.current) {

            const cfg = new Configuration({ accessToken: session?.accessToken });
            const api = new DomainsApi(cfg, `${Config.DomainHost}`);
            try {
                await api.domainsIdTransferPost(transferDomain?.id, { owner: target.current?.value as string });
                await loadDomains(setDomains, setError);
                setTransferDomain(undefined);
            } catch {
                Sentry.captureException(error);
                setError(true);
                setTransferDomain(undefined);
            }
        }
    };

    async function removeDomain(id: number, setDomains: (domains: Array<ModelDomain>) => void, setError: (error: boolean) => void) {

        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        try {
            await api.domainsIdDelete(id);
            await loadDomains(setDomains, setError);
        } catch (error) {
            Sentry.captureException(error);
            setError(true);
        }

    }

    async function approveDomain(id: number, setDomains: (domains: Array<ModelDomain>) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        try {
            await api.domainsIdApprovePost(id);
            await loadDomains(setDomains, setError);
        } catch (error) {
            Sentry.captureException(error);
            setError(true);

        }
    }


    async function createDomain(domain: string, setDomains: (domains: Array<ModelDomain>) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);

        try {
            await api.domainsPost({ fqdn: domain });
            await loadDomains(setDomains, setError);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        catch (error: any) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (error.response.status == 400) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (error.response.data.message == "Domain already exists") {
                    setCreateError("Diese Domain existiert bereits! Ein anderer Nutzer hat die Domain angelegt.");
                }
            } else {
                Sentry.captureException(error);
            }
        }

    }

    const columns: Array<GridColDef> = [
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

                const approve = async (event: FormEvent<Element>) => {
                    event.preventDefault();
                    await approveDomain(row.id!, setDomains, setError);
                };

                const remove = async (event: FormEvent<Element>) => {
                    event.preventDefault();

                    const cfg = new Configuration({ accessToken: session?.accessToken });
                    const api = new SSLApi(cfg, `${Config.PkiHost}`);
                    try {
                        const response = await api.sslActiveGet(row.fqdn!);
                        setDeleteOpen(true);
                        setSelected(row);
                        setToBeDeleted(response.data);
                    } catch (error) {
                        Sentry.captureException(error);
                        setError(true);
                    }
                };

                const openDelegation = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setDelegationDomain(row);
                };

                const transfer = (event: FormEvent<Element>) => {
                    event.preventDefault();
                    setTransferDomain(row);
                };

                buttons.push(<Button key="approve" color="success" disabled={!row.permissions?.can_approve}
                    sx={{ px: 1, mx: 1 }} variant="outlined" onClick={(event) =>{
                        void (async () => {
                            await approve(event).catch((e) => Sentry.captureException(e));
                        })();
                    }}>Freischalten</Button>);
                buttons.push(<Button key="delete" color="warning" disabled={!row.permissions?.can_delete}
                    sx={{ px: 1, mx: 1 }} variant="outlined" onClick={(event) => {
                        void (async () => {
                            await remove(event).catch((e) => Sentry.captureException(e));
                        })();
                    }}
                    startIcon={<DeleteIcon/>}>Löschen</Button>);
                buttons.push(<Button key="delegate" color="inherit" disabled={!row.permissions?.can_delegate}
                    sx={{ px: 1, mx: 1 }} variant="outlined" onClick={openDelegation}>Delegationen
                    bearbeiten</Button>);
                buttons.push(<Button key="transfer" color="inherit" disabled={!row.permissions?.can_transfer}
                    sx={{ px: 1, mx: 1 }} variant="outlined" onClick={transfer}>Zuständigkeit
                    übertragen</Button>);

                return <Box>{buttons}</Box>;
            },
        },
    ];

    let delegationModal;
    if (delegationDomain) {
        delegationModal = <DelegationModal initDelegationDomain={delegationDomain} onClose={(domain: ModelDomain) => {
            const updated: Array<ModelDomain> = [...domains];
            updated[updated.findIndex((x) => x.id == delegationDomain.id)].delegations = domain.delegations;
            setDomains(updated);
            setDelegationDomain(undefined);
        }}/>;
    }

    let deleteDialog;
    if (selected && deleteOpen) {
        deleteDialog = (
            <Dialog open={deleteOpen} onClose={handleDeleteClose}>
                <DialogTitle>Domain löschen</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <Typography>
                            Sie möchten die Domain {selected?.fqdn} löschen.
                        </Typography>
                        {toBeDeleted.length > 0 && (
                            <Alert severity="warning">
                                <AlertTitle>Achtung</AlertTitle>
                                Diese Löschung wird automatisch <b>alle</b> zugeordneten Zertifikate widerrufen.
                                <ul id="toBeRevoked">
                                    {toBeDeleted.map((cert) => {
                                        return (
                                            <li key={cert.id}>
                                                Serial: {cert.serial}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Alert>
                        )}
                        <Typography>
                            Möchten Sie wirklich fortfahren?
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" disabled={deleting} onClick={handleDeleteClose}>
                        Abbrechen
                    </Button>
                    <Button variant="outlined" color="warning" disabled={deleting} onClick={
                        () => {
                            void ( async () => {
                                setDeleting(true);
                                await removeDomain(selected.id!, setDomains, setError);
                                setDeleting(false);
                                handleDeleteClose();}
                            )();}
                    }>
                        Löschen{" "}
                        {deleting && (
                            <CircularProgress size={24} sx={{
                                color: green[500],
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                marginTop: "-12px",
                                marginLeft: "-12px",
                            }}/>
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        );
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
                <Button key="cancel" variant="outlined" color="inherit"
                    onClick={() => setTransferDomain(undefined)}>Abbrechen</Button>
                <Button key="revoke" variant="outlined" color="warning" onClick={(e) => void transfer(e)}>Übertragen</Button>
            </DialogActions>
        </Dialog>;
    }
    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre
        Hosts</Typography>
    {(error && <Alert
        severity="error">{typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten."}</Alert>) ?? <>
        <div style={{ flex: 1, overflow: "hidden" }}>
            <DataGrid
                initialState={{ sorting: { sortModel: [{ field: "fqdn", sort: "asc" }] } }}
                sx={dataGridStyle}
                columns={columns}
                paginationModel={pageModel}
                slots={{
                    toolbar: QuickSearchToolbar,
                    loadingOverlay: LinearProgress as GridSlots["loadingOverlay"],
                }}
                slotProps={{
                    loadingOverlay: { color: "inherit" },
                }}
                showToolbar
                loading={loading}
                localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                onPaginationModelChange={(newPageModel) => setPageModel(newPageModel)}
                pageSizeOptions={[5, 15, 25, 50, 100]}
                pagination rows={domains}></DataGrid>
        </div>

        <Box component="form" onSubmit={(e) => void create(e) }
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
                }}
                variant="standard"/>
            {createError && <Alert severity="error" sx={{ mt: 1 }}>{createError}</Alert>}
            <Button type="submit" id="new" variant="contained"
                disabled={!session || dnsRunning || createError != undefined} color="success"
                startIcon={<AddCircleOutlineIcon/>} sx={{ mt: 1 }}>Erstelle Host {
                    dnsRunning && <CircularProgress size={24} sx={{
                        color: green[500],
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginTop: "-12px",
                        marginLeft: "-12px",
                    }}/>
                }</Button>
        </Box>
    </>}
    {deleteDialog}
    {transferDialog}
    {delegationModal}
    </Box>;
}
