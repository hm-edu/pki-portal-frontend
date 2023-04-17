/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { green } from "@mui/material/colors";
import { DataGrid, GridColDef, GridPaginationModel, GridRowId } from "@mui/x-data-grid";
import FileDownload from "@mui/icons-material/FileDownload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Stack from "@mui/material/Stack";
import ListItem from "@mui/material/ListItem";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import * as Sentry from "@sentry/nextjs";

import React, { FormEvent, useEffect, useState, useRef, FormEventHandler } from "react";
import { DomainsApi, ModelDomain } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { SSLApi } from "../../api/pki/api";
import { Configuration as PKIConfig } from "../../api/pki/configuration";
import { Config } from "../../src/config";
import { Buffer } from "buffer";
import { KeyPair } from "../../src/keypair";
import { dataGridStyle, modalTheme } from "../../src/theme";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import styled from "@emotion/styled";
import { createP12 } from "../../src/pkcs12";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { QuickSearchToolbar } from "../../src/toolbar";
import { AlertTitle } from "@mui/material";
const CustomSelect = styled(Select<string>)(() => ({
    "&.MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "#C6C6C6",
        },
        "&:hover fieldset": {
            borderColor: "#C6C6C6",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#C6C6C6",
        },
    },
}));
const CustomTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "#C6C6C6",
        },
        "&:hover fieldset": {
            borderColor: "#C6C6C6",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#C6C6C6",
        },
    },
}));

export default function SslGenerator() {

    interface SwitchProps {
        checked: boolean;
    }

    const columnStyle = {
        flex: "auto",
        minWidth: "49%",
        maxWidth: "100%",
        display: "flex",
        height: "100%",
        gap: "5px",
        flexDirection: "column",
        alignContent: "flex-start",
    };

    const [progress, setProgress] = useState<JSX.Element>(<></>);
    const [loadingDomains, setLoadingDomains] = useState(true);
    const [error, setError] = useState<boolean>(false);
    const [generateKey, setGenerateKey] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(false);
    const [keypair, setKeyPair] = useState<KeyPair>();
    const [pkcs12, setPkcs12] = useState<boolean>(false);
    const [domains, setDomains] = useState<ModelDomain[]>([]);
    const [selected, setSelected] = useState<GridRowId[]>();
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
    const { data: session, status } = useSession();

    const p12PasswordRef = useRef<TextFieldProps>(null);
    const pkcs12Ref = useRef<HTMLInputElement>(null);

    const buttonSx = {
        ...(generatedKey && {
            bgcolor: green[500],
            "&:hover": {
                bgcolor: green[700],
            },
        }), mt: 1, mb: 2,
    };
    const switchRef = useRef<SwitchProps>(null);
    const [commonName, setCommonName] = React.useState("");

    const handleChange = (event: SelectChangeEvent<unknown>) => {
        setCommonName(event.target.value as string);
    };
    function keySegment(segment: string, fileName: string, label: string) {
        return <Box sx={columnStyle}>
            <Typography variant="h6">{label}</Typography>
            <Button color="inherit" variant="outlined" startIcon={<FileDownload />} download={fileName} href={"data:application/x-pem-file;base64," + Buffer.from(segment).toString("base64")}>Herunterladen</Button>
            <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{segment}</code>
            <Button color="inherit" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { void navigator.clipboard.writeText(segment); }}>In die Zwischenablage kopieren</Button>
        </Box>;
    }

    const createHandler: FormEventHandler<HTMLFormElement> = (event: FormEvent) => {
        event.preventDefault();
        void create();
    };

    useEffect(() => {
        if (status == "authenticated" && !generateKey && !generatedKey) {
            setProgress(<Typography>Bitte warten...</Typography>);
            const cfg = new Configuration({ accessToken: session.accessToken });
            const api = new DomainsApi(cfg, `${Config.DOMAIN_HOST}`);
            api.domainsGet().then((response) => {
                setError(false);
                setDomains(response.data.filter(x => x.approved));
                setLoadingDomains(false);
            }).catch((error) => {
                Sentry.captureException(error);
                setLoadingDomains(false);
            });
        } else if (status == "unauthenticated") {
            setLoadingDomains(false);
            setProgress(<Typography>Sie sind nicht angemeldet</Typography>);
            setError(true);
        }
    }, [session, session?.user, session?.user?.email, session?.user?.name]);

    const columns: GridColDef[] = [
        {
            field: "fqdn", headerName: "FQDN", flex: 1, sortComparator: (v1, v2) => {
                const a = v1 as string;
                const b = v2 as string;
                return a.split(".").reverse().join(".").localeCompare(b.split(".").reverse().join("."));
            },
        },
    ];

    let body: JSX.Element | undefined = undefined;
    let publicKeyElement: JSX.Element = <></>;
    let fqdns: string[] = [];
    let cn = "";
    if (selected) {
        fqdns = domains.filter(x => selected.includes(x.id!)).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => domain.fqdn!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        cn = domains.find(x => String(x.id) == commonName)?.fqdn!;
    }
    if (generateKey) {
        publicKeyElement = <Box sx={columnStyle}>
            <Typography variant="h6">Öffentlicher Schlüssel</Typography>
            <Box sx={{ padding: 2 }}>
                <CircularProgress size={24} sx={{ color: green[500], position: "relative", left: "50%", marginLeft: "-12px" }} />
            </Box>
            <Box id="modal-modal-description">
                {progress}
            </Box>
        </Box>;
    } else if (keypair && keypair.public && !generateKey) {
        publicKeyElement = keySegment(keypair.public, `${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.pem`, "Öffentlicher Schlüssel");
    }

    if (!generatedKey && !generateKey && !error) {
        body = <Box sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
            <Box sx={{ width: "100%", height: "100%", display: "flex", gap: "10px", flexDirection: "row" }}>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", height: "100%", flexDirection: "column" }}>
                    <Typography variant="h6">Ihre Domains:</Typography>
                    <DataGrid columns={columns}
                        sx={dataGridStyle}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: "fqdn", sort: "asc" }],
                            },
                        }}
                        components={{ Toolbar: QuickSearchToolbar }}
                        paginationModel={paginationModel}
                        rowSelectionModel={selected}
                        onRowSelectionModelChange={(event) => {
                            setSelected(event);
                            if (commonName != "" && !event.find(x => x == commonName)) {
                                setCommonName(String(event.at(0)));
                            }
                            if (commonName == "") {
                                setCommonName(String(event.at(0)));
                            }
                        }}
                        loading={loadingDomains} density="compact"
                        onPaginationModelChange={(newPaginationModel) => setPaginationModel(newPaginationModel)}
                        pageSizeOptions={[5, 15, 25, 50, 100]}
                        pagination checkboxSelection rows={domains}></DataGrid>

                </Box>
                <Box sx={{ flex: "auto", minWidth: "49%", maxWidth: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>
                    <Typography variant="h6">Aktuelle Auswahl:</Typography>

                    <FormControl size="small">
                        <InputLabel id="cn-select-helper-label">Common Name</InputLabel>
                        <CustomSelect
                            required
                            labelId="cn-select-helper-label"
                            id="cn-select-helper"
                            value={commonName}
                            label="Common Name"
                            onChange={handleChange}
                        >
                            {selected && selected.length > 0 && domains.filter(x => selected.includes(x.id!)).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => {
                                return <MenuItem value={domain.id} key={domain.id}> {domain.fqdn} </MenuItem>;
                            })}
                        </CustomSelect>
                    </FormControl>
                    <Typography variant="h6">Alle ausgewählten FQDNs:</Typography>
                    <List dense sx={{ flex: "auto", width: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>
                        {selected && selected.length > 0 && domains.filter(x => selected.includes(x.id!) && String(x.id) != commonName).sort((a, b) => a.fqdn!.localeCompare(b.fqdn!)).map((domain) => {
                            const labelId = `checkbox-list-label-${domain.id!}`;
                            return <ListItem sx={{ display: "flex" }} key={domain.id} disablePadding> <ListItemText id={labelId} primary={domain.fqdn} /> </ListItem>;
                        })}
                    </List>

                </Box>
            </Box>
            <Box sx={{ width: "100%", display: "flex", gap: "10px", flexDirection: "row" }}>
                <Box sx={{ flex: "auto", minWidth: "50%", maxWidth: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>

                    <Typography variant="h6">Schlüsslart:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>RSA</Typography>
                        <Switch defaultChecked color="secondary" inputRef={switchRef} />
                        <Typography>ECDSA</Typography>
                    </Stack>
                </Box>
                <Box sx={{ flex: "auto", minWidth: "50%", maxWidth: "100%", display: "flex", flexDirection: "column", alignContent: "flex-start", overflow: "auto" }}>

                    <Stack direction="column">
                        <FormControlLabel control={<Checkbox color="secondary" inputRef={pkcs12Ref} onChange={() => setPkcs12(pkcs12Ref.current!.checked)} />} label="Zusätzliche PKCS12 Datei generieren" />
                        <CustomTextField size="small" label="PKCS12 Passwort" type="password" inputRef={p12PasswordRef} fullWidth variant="outlined" disabled={!pkcs12} />
                    </Stack>
                </Box>
            </Box>
            <Alert severity="warning" sx={{ mt: 1 }}>
                <AlertTitle>Hinweis:</AlertTitle>
                <Typography>Es zeichnet sich eine weitere Verkürzung der Zertifikatslaufzeiten auf 90 Tage ab. Wir empfehlen, sofern möglich, den Einsatz von ACME. Sollten Sie hierzu Fragen haben, wenden Sie sich gerne an die Zentrale IT. Weiterführende Informationen zu den Plänen finden sich unter anderem bei <a href="https://www.heise.de/news/Google-moechte-Laufzeiten-fuer-TLS-Zertifikate-verkuerzen-8151372.html">heise.de</a> oder <a href="https://www.chromium.org/Home/chromium-security/root-ca-policy/moving-forward-together/">Google</a>.</Typography>
            </Alert>
            <Button type="submit" color="inherit" variant="outlined" disabled={!selected || selected.length == 0 || loadingDomains || generateKey || generatedKey} sx={buttonSx}>Generiere Zertifikat {loadingDomains && (
                <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
            )}</Button>
        </Box>;
    } else if (error) {
        body = <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
            <Alert sx={{ width: "100%" }} severity="error">{progress}</Alert>
        </Box >;
    } else if (generatedKey || generateKey && keypair?.private) {
        body = <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "column" }}>
            <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
                {keySegment(keypair!.private, `${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.key`, "Privater Schlüssel")}
                <Box sx={columnStyle}>
                    {publicKeyElement}
                </Box>
            </Box>
            {keypair?.pkcs12 && <Button color="inherit" variant="outlined" startIcon={<FileDownload />} download={`${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.p12`} href={"data:application/x-pkcs12;base64," + keypair?.pkcs12}>PKCS12 Herunterladen</Button>}
        </Box>;
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <Box sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
        <Box component="form" onSubmit={createHandler} sx={{ width: "100%", display: "flex", height: "100%", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
            <Typography variant="h1">Erstellung eines neuen Serverzertifikats</Typography>
            {body}
        </Box>
        <Modal open={loadingDomains} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={modalTheme}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen Serverzertifikats
                </Typography>
                <Box sx={{ padding: 2 }}>
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                </Box>
                <Box id="modal-modal-description" sx={{ mt: "24px" }}>
                    {progress}
                </Box>
            </Box>
        </Modal>
    </Box >;

    async function create() {
        setProgress(<Typography>Erstelle privaten Schüssel</Typography>);
        if (!loadingDomains && selected && session?.accessToken) {
            const CsrBuilder = (await import("../../src/csr")).CsrBuilder;
            const csr = new CsrBuilder();
            const type = switchRef.current?.checked ? "ecdsa" : "rsa";
            const password = p12PasswordRef.current?.value as string;
            csr.build(type, fqdns, cn).then((result) => {
                setKeyPair({ private: result.privateKey, public: undefined, pkcs12: undefined });
                setGenerateKey(true);
                setProgress(<><Typography>Signiere CSR...</Typography><Typography>(Dieser Schritt kann bis zu 5 Minuten dauern!)</Typography></>);
                const cfg = new PKIConfig({ accessToken: session.accessToken });
                const api = new SSLApi(cfg, `${Config.PKI_HOST}`);
                api.sslCsrPost({ csr: result.csr }, { timeout: 600000 }).then(async x => { return { public: x.data, pkcs12: pkcs12 ? await createP12(result.privateKey, [x.data], password, type) : undefined }; }).then((response) => {
                    const element = document.createElement("a");
                    element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(response.public).toString("base64"));
                    element.setAttribute("download", `${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.pem`);
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);

                    element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(result.privateKey).toString("base64"));
                    element.setAttribute("download", `${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.key`);
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    if (response.pkcs12) {
                        element.setAttribute("href", "data:application/x-pkcs12;base64," + response.pkcs12);
                        element.setAttribute("download", `${cn}_${moment().format("DD-MM-YYYY_HH-mm-ss")}.p12`);
                        element.style.display = "none";
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                    }
                    setKeyPair({ private: result.privateKey, public: response.public, pkcs12: response.pkcs12 });
                    setGeneratedKey(true);
                    setLoadingDomains(false);
                    setGenerateKey(false);
                }).catch((error) => {
                    Sentry.captureException(error);
                    setProgress(<>
                        Es ist ein unbekannter Fehler bei der Erstellung des Zertifikats aufgetreten. Bitte versuchen Sie es erneut oder wenden sich an den IT-Support
                    </>);
                    setError(true);
                    setGenerateKey(false);
                    setLoadingDomains(false);
                });
            }).catch((error) => {
                Sentry.captureException(error);
                setProgress(<>
                    Es ist ein unbekannter Fehler bei der Erstellung des Zertifikats aufgetreten. Bitte versuchen Sie es erneut oder wenden sich an den IT-Support
                </>);
                setError(true);
                setGenerateKey(false);
                setLoadingDomains(false);
            });
        }
    }
}