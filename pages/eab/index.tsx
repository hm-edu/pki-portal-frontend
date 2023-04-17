import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Moment from "react-moment";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { DataGrid, GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import React, { FormEvent, RefObject } from "react";
import { EABApi, ModelsEAB } from "../../api/eab/api";
import { Configuration } from "../../api/eab/configuration";
import { AuthProps, Config } from "../../src/config";
import { RecommendedConfigurationsComponent } from "../../src/eabConfiguration";
import { deDE } from "@mui/x-data-grid";
import { dataGridStyle } from "../../src/theme";
import { TextFieldProps } from "@mui/material/TextField";
import TextField from "@mui/material/TextField";
import withSession from "../../src/session";
import LoggedOut from "../logout";
import * as Sentry from "@sentry/nextjs";

interface EabState { initalized: boolean; paginationModel: GridPaginationModel; tokens: ModelsEAB[]; selected: GridRowSelectionModel; loading: boolean; recommendations: boolean; error: string | boolean | undefined }

class EabTokens extends React.Component<{ session: AuthProps | null; status: string }, EabState> {

    initalized = false;

    tdStyle = {
        padding: "0px",
        height: "36px",
    };

    newComment: RefObject<TextFieldProps>;

    private removeEAB(id: string) {
        const cfg = new Configuration({ accessToken: this.props.session?.accessToken });
        const api = new EABApi(cfg, `${Config.EAB_HOST}`);
        api.eabIdDelete(id).then(() => {
            this.loadTokens();
        }).catch((error) => {
            Sentry.captureException(error);
        });
    }

    private loadTokens() {
        const cfg = new Configuration({ accessToken: this.props.session?.accessToken });
        const api = new EABApi(cfg, `${Config.EAB_HOST}`);
        api.eabGet().then((response) => {
            this.setState({ tokens: (response.data), loading: false });
        }).catch((error) => {
            Sentry.captureException(error);
            this.setState({ error: true, loading: false });
        });
    }

    private createEABToken() {
        const cfg = new Configuration({ accessToken: this.props.session?.accessToken });
        const api = new EABApi(cfg, `${Config.EAB_HOST}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-non-null-assertion
        api.eabPost({ comment: (this.newComment.current!.value as string) }).then(() => {
            this.loadTokens();
        }).catch((error) => {
            Sentry.captureException(error);
        });
    }

    columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 280 },
        { field: "comment", headerName: "Kommentar", width: 280 },
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
            minWidth: 150,
            renderCell: (params) => {
                const row = (params.row as ModelsEAB);
                const remove = (event: FormEvent<Element>) => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.setState({ selected: [] });
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.removeEAB(row.id!);
                };
                return <Button color="warning" sx={{ px: 1, mx: 1 }} variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Löschen</Button>;
            },
        },
    ];

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(props: { session: AuthProps | null; status: string }) {
        super(props);
        this.state = {
            paginationModel: { page: 0, pageSize: 50 } ,
            tokens: [],
            selected: [],
            loading: true,
            recommendations: false,
            error: undefined,
            initalized: false,
        };
        this.newComment = React.createRef<TextFieldProps>();
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
        if (this.props.session && this.props.status == "authenticated" && !this.initalized) {
            this.initalized = true;
            this.loadTokens();
        } else if (this.initalized && this.props.status == "unauthenticated") {
            return <LoggedOut></LoggedOut>;
        } else if (this.props.status == "unauthenticated") {
            this.setState({ error: "Bitte melden Sie sich an!", loading: false });
        }
        return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Typography variant="h1">Ihre ACME Tokens</Typography>
            <Sentry.ErrorBoundary fallback={<p>{typeof this.state.error === "string" ? this.state.error : "Ein unerwarteter Fehler ist aufgetreten."}</p>}>
                <DataGrid columns={this.columns}
                    sx={dataGridStyle}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                key_bytes: false,
                            },
                        },
                    }}
                    paginationModel={this.state.paginationModel}
                    components={{ LoadingOverlay: LinearProgress }}
                    componentsProps={{ loadingOverlay: { color: "inherit" } }}
                    loading={this.state.loading}
                    onRowSelectionModelChange={(event) => { this.setState({ selected: event }); }}
                    localeText={{ ...deDE.components.MuiDataGrid.defaultProps.localeText }}
                    rowSelectionModel={this.state.selected}
                    onPaginationModelChange={(newPaginationModel) => this.setState({ paginationModel: newPaginationModel })}
                    pageSizeOptions={[5, 15, 25, 50, 100]}
                    pagination rows={this.state.tokens} />
            </Sentry.ErrorBoundary>
            {this.selection()}
            <Box component="form" sx={{ maxWidth: "100%", display: "flex", flexDirection: "column" }} onSubmit={(e: FormEvent<Element>) => {
                e.preventDefault();
                this.createEABToken();
            }}>
                <TextField
                    inputProps={{ pattern: "[a-zA-Z0-9-_.: üäöÄÖÜß]*" }}
                    label="Optionaler Kommentar"
                    inputRef={this.newComment}
                    variant="standard" />
                <Button type="submit" variant="contained" disabled={!this.props.session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }} >Erstelle neuen Token</Button>
            </Box>
        </Box>;
    }
}
const AuthEabTokens = withSession(EabTokens);

export default AuthEabTokens;