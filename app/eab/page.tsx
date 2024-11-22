"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef, GridRowSelectionModel, GridSlots } from "@mui/x-data-grid";
import { deDE } from "@mui/x-data-grid/locales";
import * as Sentry from "@sentry/nextjs";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

import { EABApi, ModelsEAB } from "@/api/eab/api";
import { Configuration } from "@/api/eab/configuration";
import EabCreateForm from "@/app/eab/EabCreateForm";
import EabDeleteDialog from "@/app/eab/EabDeleteDialog";
import EabTokenDetails from "@/app/eab/EabTokenDetails";
import { Config } from "@/components/config";
import { dataGridStyle } from "@/components/theme";

const EabTokens = () => {
    const [tokens, setTokens] = useState<ModelsEAB[]>([]);
    const [selected, setSelected] = useState<GridRowSelectionModel|undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | boolean | undefined>(undefined);
    const [toDelete, setDelete] = useState<ModelsEAB | undefined>(undefined);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });

    const { data: session, status } = useSession();

    async function loadTokens() {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new EABApi(cfg, `${Config.EabHost}`);
        try {
            const response = await api.eabGet();
            setTokens(response.data);
            setLoading(false);
        } catch {
            Sentry.captureException(error);
            setLoading(false);
            setError(true);}
    }

    async function createEABToken(comment: string) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new EABApi(cfg, `${Config.EabHost}`);
        try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-non-null-assertion
            await api.eabPost({ comment });
            await loadTokens();
        } catch {
            Sentry.captureException(error);
        }
    }

    let deleteModal = <></>;

    if (toDelete && session && session.accessToken) {
        deleteModal = <EabDeleteDialog initOpen={true} accessToken={session?.accessToken} id={toDelete.id!} callback={(success) => {
            setDelete(undefined);
            if (success) {
                void loadTokens();
            }
        }} />;
    }

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 280 },
        { field: "comment", headerName: "Kommentar", width: 280 },
        { field: "key_bytes", headerName: "HMAC", width: 280 },
        {
            field: "bound_at", headerName: "Bereits verwendet?", type: "boolean", width: 150,
            valueGetter: (value) => {
                return value != null || value != undefined;
            },
        }, {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const remove = (event: FormEvent<Element>) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const row = params.row as ModelsEAB;

                    setDelete(row);
                };
                return <Button color="warning" sx={{ px: 1, mx: 1 }} variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Löschen</Button>;
            },
        },
    ];

    function selection() {
        if (selected && selected.length > 0) {
            const token = tokens.find((token) => token.id === selected.at(0));
            return <EabTokenDetails token={token} />;
        }
        return <></>;
    }

    if (Config.DisableAcme) {
        return (
            <Alert severity="warning">
                <AlertTitle>Hinweis</AlertTitle>
                    Die Verwendung von ACME Tokens ist derzeit deaktiviert!
            </Alert>
        );
    }

    useEffect(() => {
        if (session && status == "authenticated") {
            Sentry.setUser({ email: session?.user?.email?? "" });
            void loadTokens();
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    if (status == "unauthenticated") {
        return <Alert severity="error">Bitte melden Sie sich an!</Alert>;
    }

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre ACME Tokens</Typography>
        {(error && <Alert severity="error">{typeof error === "string" ? error : "Ein unerwarteter Fehler ist aufgetreten."}</Alert>) || <>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <DataGrid columns={columns}
                    sx={dataGridStyle}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                key_bytes: false,
                            },
                        },
                    }}
                    paginationModel={paginationModel}
                    slots={{ loadingOverlay: LinearProgress as GridSlots["loadingOverlay"] }}
                    slotProps={{ loadingOverlay: { color: "inherit" } }}
                    loading={loading}
                    onRowSelectionModelChange={(event) => { setSelected(event); }}
                    localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                    rowSelectionModel={selected}
                    onPaginationModelChange={(newPaginationModel) => setPaginationModel(newPaginationModel)}
                    pageSizeOptions={[5, 15, 25, 50, 100]}
                    pagination rows={tokens} />
            </div>
            {selection()}
            {deleteModal}
            <EabCreateForm session={session} createEABToken={() =>{ void createEABToken();}} />
        </>}
    </Box>;
};

export default EabTokens;
