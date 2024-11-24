"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import { ModelsEAB } from "../api/eab/api";

import { Config } from "@/components/config";
import { modalTheme } from "@/components/theme";

interface EabRecommendationProps {
    token?: ModelsEAB;
    onClose: () => void;
}

const EabRecommendation = ({ token, onClose }: EabRecommendationProps) => {

    // eslint-disable-next-line @typescript-eslint/ban-types

    const id = token?.id ? token?.id : "";
    const key_bytes = token?.key_bytes ? token?.key_bytes : "";

    const register_acme_sh = `acme.sh --register-account \\
    --server ${Config.AcmeHost}/acme/acme/directory \\
    --email noreply@notused.local \\
    --eab-kid "${id}" \\
    --eab-hmac-key "${key_bytes}"`;

    const issue_acme_sh = `acme.sh --issue \\
    --standalone \\
    --keylength ec-256 \\
    --server ${Config.AcmeHost}/acme/acme/directory \\
    -d dummy.your.doman`;

    const certbot = `certbot certonly \\
    --standalone --non-interactive --agree-tos --email noreply@notused.local \\
    --server ${Config.AcmeHost}/acme/acme/directory  \\
    --key-type ecdsa \\
    --eab-kid ${id} \\
    --eab-hmac-key ${key_bytes} \\
    --issuance-timeout 300 \\
    --domains dummy.your.doman `;

    return <Modal open={token != undefined} onClose={() => { onClose(); }} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={{ ...modalTheme, width: 1000 }}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                    Vorgeschlagene Konfigurationen
            </Typography>
            <Box sx={{ height: 680 }}>
                {(token?.key_bytes == undefined || token.key_bytes == "" || token.bound_at) && <Alert severity="warning">Account bereits registriert!</Alert>}
                    Registrierung acme.sh
                <pre>
                    <code style={{ width: "100%", display: "inline-block" }}> {register_acme_sh} </code>
                </pre>
                    Zertifikatsbezug acme.sh
                <pre>
                    <code style={{ width: "100%", display: "inline-block" }}> {issue_acme_sh} </code>
                </pre>
                    Zertifikatsbezug certbot (ab Version 2.0)
                <pre>
                    <code style={{ width: "100%", display: "inline-block" }}> {certbot} </code>
                </pre>
            </Box>
        </Box>
    </Modal >;
};

export default EabRecommendation;
