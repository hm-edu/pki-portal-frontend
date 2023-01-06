import { useSession } from "next-auth/react";
import { ChangeEvent, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/system/Box";
import { fromPEM } from "../../src/csr";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { Alert, AlertTitle, CircularProgress, List } from "@mui/material";
import { SSLApi } from "../../api/pki/api";
import { Configuration as PKIConfig } from "../../api/pki/configuration";
import FileDownload from "@mui/icons-material/FileDownload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Config } from "../../src/config";
import { green } from "@mui/material/colors";
import moment from "moment";
import { AxiosError } from "axios";
import forge from "node-forge";
const typemap: Record<string, string> = {
    "2.5.4.6": "C",
    "2.5.4.11": "OU",
    "2.5.4.10": "O",
    "2.5.4.3": "CN",
    "2.5.4.7": "L",
    "2.5.4.8": "ST",
    "2.5.4.12": "T",
    "2.5.4.42": "GN",
    "2.5.4.43": "I",
    "2.5.4.4": "SN",
    "1.2.840.113549.1.9.1": "E-mail",
};

export default function ServerCertificatesCsr() {
    const [error, setError] = useState<undefined | boolean | string>(undefined);
    const { data: session, status } = useSession();
    const [generateKey, setGenerateKey] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(false);
    const [filename, setFilename] = useState("");
    const [keyFileName, setKeyFileName] = useState("");
    const [csr, setCsr] = useState("");
    const [key, setKey] = useState("");
    const [values, setValues] = useState<[string, string][]>([]);

    const sendCsr = () => {
        if (session && session.accessToken) {
            setGenerateKey(true);
            const cfg = new PKIConfig({ accessToken: session.accessToken });
            const api = new SSLApi(cfg, `${Config.PKI_HOST}`);
            api.sslCsrPost({ csr }).then((response) => {
                const element = document.createElement("a");
                const name = `${moment().format("DD-MM-YYYY_HH-mm-ss")}.pem`;
                element.setAttribute("href", "data:application/x-pem-file;base64," + Buffer.from(response.data).toString("base64"));
                element.setAttribute("download", name);
                element.style.display = "none";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                setKey(response.data);
                setGenerateKey(false);
                setGeneratedKey(true);
                setKeyFileName(name);
            }).catch((error) => {
                if (error instanceof AxiosError) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - AxiosError is not typed correctly
                    const response = (error as AxiosError).response?.data.message as string;
                    setError(response);
                    setGenerateKey(false);
                }
            });
        }
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }
        const file = e.target.files[0];
        const { name } = file;
        setFilename(name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                const content = evt.target.result.toString();
                const buffer = fromPEM(content);
                const csr = forge.pki.certificationRequestFromPem(content) as forge.pki.CertificateRequest;
                const attributes: [string, string][] = [];
                if (buffer) {
                    const pkcs10 = pkijs.CertificationRequest.fromBER(buffer);
                    pkcs10.subject.typesAndValues.forEach((value) => {
                        const type = typemap[value.type];
                        if (type) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                            attributes.push([type, value.value.valueBlock.value]);
                        }
                    });
                    if (pkcs10.attributes) {
                        for (let i = 0; i < pkcs10.attributes.length; i++) {
                            const typeval = pkcs10.attributes[i].type;
                            for (let j = 0; j < pkcs10.attributes[i].values.length; j++) {
                                if ((pkcs10.attributes[i].values[j] instanceof asn1js.Utf8String) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.BmpString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.UniversalString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.NumericString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.PrintableString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.TeletexString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.VideotexString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.IA5String) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.GraphicString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.VisibleString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.GeneralString) ||
                                    (pkcs10.attributes[i].values[j] instanceof asn1js.CharacterString)) {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
                                    attributes.push([typeval, pkcs10.attributes[i].values[j].valueBlock.value]);
                                }
                            }
                        }
                    }
                    if (csr) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        const extensions = csr.getAttribute({ name: "extensionRequest" })?.extensions;
                        if (extensions) {
                            extensions.forEach((ext) => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                if (ext.name == "subjectAltName") {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                    const values = (ext.altNames as { type: number; value: string }[]).map((alt) => {
                                        return alt.value;
                                    });
                                    attributes.push(["subjectAltName", values.join(", ")]);
                                }
                            });
                        }

                    }
                    setValues(attributes);
                    setCsr(content);
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    if (status == "unauthenticated") {
        return <Box sx={{ minWidth: 0, maxWidth: "100%", maxHeight: "100%", minHeight: 0, display: "flex", gap: "10px", flexDirection: "row" }}>
            <Alert sx={{ width: "100%" }} severity="error"><Typography>Sie sind nicht angemeldet</Typography></Alert>
        </Box >;
    }

    return <Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: "5px" }}>
        <Typography variant="h1"> Erstellung eines neuen Serverzertifikats</Typography>
        <Button
            component="label"
            variant="outlined"
            color="inherit"
            startIcon={<UploadFileIcon />}
            disabled={generateKey || generatedKey}
            sx={{ marginRight: "1rem", width: "100%" }}
        >
            CSR (Certificate Sigining Request) hochladen
            <input type="file" hidden onChange={handleFileUpload} />
        </Button>
        <Typography variant="h2">Informationen aus dem CSR</Typography>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography>Dateiname: {filename}</Typography>
            <List> {values.map((value) => { return <Typography>{value[0]}: {value[1]}</Typography>; })} </List>
        </Box>
        <Button variant="outlined" color="inherit" disabled={!filename || generateKey || generatedKey} onClick={sendCsr} sx={{ width: "100%" }}>Absenden {generateKey && <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />}</Button>
        {generatedKey && <Box sx={{
            flex: "auto",
            minWidth: "49%",
            maxWidth: "100%",
            display: "flex",
            maxHeight: "100%",
            minHeight: "49%",
            pt: "5px",
            gap: "5px",
            flexDirection: "column",
            alignContent: "flex-start",
        }}>
            <Button color="inherit" variant="outlined" startIcon={<FileDownload />} download={keyFileName} href={"data:application/x-pem-file;base64," + Buffer.from(key).toString("base64")}>Herunterladen</Button>
            <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{key}</code>
            <Button color="inherit" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { void navigator.clipboard.writeText(key); }}>In die Zwischenablage kopieren</Button>
        </Box>
        }
        {error && <Alert sx={{ pt: "5px" }} severity="error"><AlertTitle>Fehler bei der Verarbeitung des CSRs</AlertTitle>{error}</Alert>}
    </Box >;

}