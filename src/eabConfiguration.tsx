import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

import React from "react";
import { ModelsEAB } from "../api/eab/api";

import { modalTheme } from "./theme";

export class RecommendedConfigurationsComponent extends React.Component<{ token: ModelsEAB | undefined; onClose: () => void }> {

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(props: { token: ModelsEAB | undefined; onClose: () => void }) {
        super(props);
        this.state = {
            token: this.props.token,
        };
    }

    render() {
        const id = this.props.token?.id ? this.props.token?.id : "";
        const key_bytes = this.props.token?.key_bytes ? this.props.token?.key_bytes : "";

        const register_acme_sh = `acme.sh --register-account \\
    --server https://acme.hm.edu/acme/acme/directory \\
    --email noreply@hm.edu \\
    --eab-kid "${id}" \\
    --eab-hmac-key "${key_bytes}"`;

        const issue_acme_sh = `acme.sh --issue \\
    --standalone \\
    --keylength ec-256 \\
    --server https://acme.hm.edu/acme/acme/directory \\
    -d dummy.hm.edu`;

        const certbot = `certbot certonly \\
    --standalone --non-interactive --agree-tos --email noreply@hm.edu \\
    --server https://acme.hm.edu/acme/acme/directory  \\
    --key-type ecdsa \\
    --eab-kid ${id} \\
    --eab-hmac-key ${key_bytes} \\
    --domain dummy.hm.edu `;

        return <Modal open={this.props.token != undefined} onClose={() => { this.props.onClose(); }} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
            <Box sx={{ ...modalTheme, width: 1000 }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Empfohlene Konfigurationen
                </Typography>
                <Box sx={{ height: 680 }}>
                    {(this.props.token?.key_bytes == undefined || this.props.token.key_bytes == "" || this.props.token.bound_at) && <Alert severity="warning">Account bereits registriert!</Alert>}
                    Regeistrierung acme.sh
                    <pre>
                        <code style={{ width: "100%", display: "inline-block" }}> {register_acme_sh} </code>
                    </pre>
                    Zertifikatzbezug acme.sh
                    <pre>
                        <code style={{ width: "100%", display: "inline-block" }}> {issue_acme_sh} </code>
                    </pre>
                    Zertifikatzbezug certbot
                    <pre>
                        <code style={{ width: "100%", display: "inline-block" }}> {certbot} </code>
                    </pre>
                </Box>
            </Box>
        </Modal >;
    }
}