import { AuthenticationResult } from "@azure/msal-browser";
import { MsalContext, withMsal, WithMsalProps } from "@azure/msal-react";
import { DataGrid, GridColDef, GridSelectionModel } from "@mui/x-data-grid";
import React, { FormEvent } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { EABApi, ModelsEAB } from "../../api/eab/api";
import { Configuration } from "../../api/eab/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";
import "./list.css";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Moment from "react-moment";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { RecommendedConfigurationsComponent } from "./configuration";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";

class EabInternal extends React.Component<WithMsalProps, { pageSize: number; tokens: ModelsEAB[]; selected: GridSelectionModel; loading: boolean; recommendations: boolean }> {
    static contextType = MsalContext;
    context!: React.ContextType<typeof MsalContext>;
    
    tdStyle = {
        padding: "0px",
        height: "36px",
    };

    private removeEAB(id: string) {
        const msalInstance = this.props.msalContext.instance;
        const account = this.props.msalContext.accounts[0];
        authorize(account, msalInstance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
            if (response) {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
                api.eabIdDelete(id).then(() => {
                    this.loadTokens();
                }).catch((error) => {
                    console.log(error);
                });
            }
        }, () => { return; });
    }

    private loadTokens() {
        const msalInstance = this.props.msalContext.instance;
        const account = this.props.msalContext.accounts[0];
        authorize(account, msalInstance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
            if (response) {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
                api.eabGet().then((response) => {
                    this.setState({ tokens: (response.data), loading: false });
                }).catch((error) => {
                    console.error(error);
                });
            }
        }, () => { return; });
    }

    private createEABToken() {
        const msalInstance = this.props.msalContext.instance;
        const account = this.props.msalContext.accounts[0];
        authorize(account, msalInstance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/EAB", "email"], (response: AuthenticationResult) => {
            if (response) {
                const cfg = new Configuration({ accessToken: response.accessToken });
                const api = new EABApi(cfg, `https://${Config.EAB_HOST}`);
                api.eabPost().then(() => {
                    this.loadTokens();
                }).catch((error) => {
                    console.log(error);
                });
            }
        }, () => { return; });
    }
    columns: GridColDef[] = [
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
                const remove = (event: FormEvent<Element>) => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.setState({ selected: [] });
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.removeEAB(row.id!);
                };
                return <Button color="warning" sx={{ px: 1, mx: 1 }} variant="contained" onClick={remove}><DeleteIcon /> Löschen</Button>;
            },
        },
    ];

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(props: WithMsalProps | Readonly<WithMsalProps>) {
        super(props);
        this.state = {
            pageSize: 15,
            tokens: [],
            selected: [],
            loading: true,
            recommendations: false,
        };
    }

    componentDidMount() {
        const isAuthenticated = this.props.msalContext.accounts.length > 0;
        if (isAuthenticated) {
            this.loadTokens();
        }
    }

    private selection(): JSX.Element | undefined {
        if (this.state.selected && this.state.selected.length > 0) {
            const token = this.state.tokens.find((token) => token.id === this.state.selected.at(0));
            const selectionHandler = function (e: FormEvent<Element>): void {
                const r = new Range();
                r.setStart(e.currentTarget, 0);
                r.setEnd(e.currentTarget, 1);
                document.getSelection()?.removeAllRanges();
                document.getSelection()?.addRange(r);
            };
            return <Box sx={{ px: 0, py: 1 }}>
                <Typography variant="h6" component="h2">
                    Details
                </Typography>
                <Table size="small" aria-label="a dense table">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ width: "200px", ...this.tdStyle }} ><b>EAB-ID</b></TableCell>
                            <TableCell sx={this.tdStyle} ><code onDoubleClick={selectionHandler}>{token?.id}</code></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: "200px", ...this.tdStyle }} ><b>HMAC-Key</b></TableCell >
                            <TableCell sx={this.tdStyle} >{token?.key_bytes && <code onDoubleClick={selectionHandler}>{token.key_bytes}</code>}</TableCell >
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: "200px", ...this.tdStyle }}><b>ACME Account verknüpft am:</b></TableCell >
                            <TableCell sx={this.tdStyle} >{token?.bound_at && <Moment format="DD.MM.YYYY HH:mm">{token?.bound_at}</Moment>}</TableCell >
                        </TableRow>
                        <TableRow>
                            <TableCell sx={this.tdStyle} colSpan={2}><Button sx={{ width: "100%" }} startIcon={<AutoFixHighIcon />} color="success" variant="contained" onClick={() => this.setState({ recommendations: true })}>Konfigurationsempfehlungen</Button></TableCell >
                        </TableRow>
                    </TableBody>
                </Table>
                {this.state.recommendations && <RecommendedConfigurationsComponent onClose={() => this.setState({ recommendations: false })} token={token} />}
            </Box >;
        } else {
            return undefined;
        }
    }

    render() {
        return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><h1>Ihre EAB Tokens</h1>
            <DataGrid autoHeight columns={this.columns}
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            key_bytes: false,
                        },
                    },
                }}
                pageSize={this.state.pageSize}
                loading={this.state.loading}
                onSelectionModelChange={(event) => {
                    this.setState({ selected: event });
                }}
                selectionModel={this.state.selected}
                onPageSizeChange={(newPageSize) => this.setState({ pageSize: newPageSize })}
                rowsPerPageOptions={[5, 15, 25, 50, 100]}
                pagination rows={this.state.tokens} />
            {this.selection()}
            <Box component="form" sx={{ maxWidth: "100%", display: "flex", flexDirection: "column" }} onSubmit={(e: FormEvent<Element>) => {
                e.preventDefault();
                this.createEABToken();
            }}>
                <Button type="submit" variant="contained" sx={{ mt: 1 }} >Erstelle neuen Token</Button>
            </Box>
        </Box>;
    }
}

export const EabTokens = withMsal(EabInternal);