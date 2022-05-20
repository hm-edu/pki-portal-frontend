/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import { EABApi, ModelsEAB } from "../../api/eab/api";
import { Configuration } from "../../api/eab/configuration";
import { Config } from "../../config";
import { authorize } from "../../auth/api";

function removeEAB(id: string, account: AccountInfo, instance: IPublicClientApplication, setTokens: (domains: ModelsEAB[]) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
            api.eabIdDelete(id).then(() => {
                loadTokens(account, instance, setTokens);
            }).catch((error) => {
                console.log(error);
            });
        }
    }, (_) => { return; });
}

function loadTokens(account: AccountInfo, instance: IPublicClientApplication, setTokens: (domains: ModelsEAB[]) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
            api.eabGet().then((response) => {
                setTokens(response.data);
            }).catch((error) => {
                console.error(error);
            });
        }
    }, (_) => { return; });
}

function createEABToken(account: AccountInfo, instance: IPublicClientApplication, setTokens: (domains: ModelsEAB[]) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
            api.eabPost().then(() => {
                loadTokens(account, instance, setTokens);
            }).catch((error) => {
                console.log(error);
            });
        }
    }, (_) => { return; });
}

export default function EABTokens() {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const [pageSize, setPageSize] = React.useState<number>(15);
    const [tokens, setTokens] = useState([] as ModelsEAB[]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<GridRowId[]>();

    useEffect(() => {
        if (isAuthenticated && account) {
            loadTokens(account, instance, (tokens: ModelsEAB[]) => { setTokens(tokens); setLoading(false); });
        }
    }, [account, instance]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const create = useCallback((event: any) => {
        event.preventDefault();
        if (account) {
            createEABToken(account, instance, setTokens);
        }
    }, [account, instance]);

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 280 },
        { field: "key_bytes", headerName: "HMAC", width: 280 },
        {
            field: "bound_at", headerName: "Bereits verwendet?", type: "boolean", width: 150,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            valueGetter: ({ value }) => { return value != undefined; },
        }, {
            field: "action",
            headerName: "Aktionen",
            sortable: false,
            filterable: false,
            hideable: false,
            flex: 1,
            renderCell: (params) => {
                const row = (params.row as ModelsEAB);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const remove = useCallback((event: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    event.preventDefault();
                    event.stopPropagation();
                    setSelected([]);
                    removeEAB(row.id!, account!, instance, setTokens);
                }, [account, instance, selected]);
                return <Button color="secondary" sx={{ px: 1, mx: 1 }} variant="outlined" onClick={remove}><DeleteIcon /> Löschen</Button>;
            },
        },
    ];

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }

    const selection = function () {
        if (selected && selected.length > 0) {
            const token = tokens.find((token) => token.id === selected.at(0));
            return <Box sx={{ px: 1, py: 1 }}>
                <table>
                    <tbody>
                        <tr>
                            <td><b>EAB-ID</b></td>
                            <td>{selected.at(0)}</td>
                        </tr>
                        <tr>
                            <td><b>HMAC-Key</b></td>
                            <td><span onDoubleClick={(e) => {
                                const r = new Range();
                                r.setStart(e.currentTarget, 0);
                                r.setEnd(e.currentTarget, 1);
                                document.getSelection()?.removeAllRanges();
                                document.getSelection()?.addRange(r);
                            }}>{token!.key_bytes}</span></td>
                        </tr>
                        <tr><td><b>ACME Account verknüpft am:</b></td><td>{token?.bound_at}</td></tr>
                    </tbody>
                </table>
            </Box >;
        } else {
            return undefined;
        }
    };

    return <div><h1>Ihre EAB Tokens</h1>
        <DataGrid autoHeight columns={columns}
            pageSize={pageSize}
            loading={loading}
            onSelectionModelChange={(event) => {
                setSelected(event);
            }}
            selectionModel={selected}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 15, 25, 50, 100]}
            pagination rows={tokens} />
        {selection()}
        <Box component="form" onSubmit={create}
            sx={{
                maxWidth: "300px",
                display: "flex",
                flexDirection: "column",
            }}>
            <Button type="submit" variant="contained" sx={{ mt: 1 }} >Erstelle neuen Token</Button>
        </Box>
    </div>;
}
