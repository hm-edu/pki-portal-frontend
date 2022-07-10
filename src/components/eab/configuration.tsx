import { MsalContext } from "@azure/msal-react";
import React from "react";
import { ModelsEAB } from "../../api/eab/api";
import "./list.css";
import Box from "@mui/material/Box";
import { Modal, Typography } from "@mui/material";

export class RecommendedConfigurationsComponent extends React.Component<{ token: ModelsEAB | undefined; onClose: () => void }> {

    static contextType = MsalContext;
    context!: React.ContextType<typeof MsalContext>;
    static style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1000,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };

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
    --server https://acme.hmtest.de/acme/acme/directory \\
    --email noreply@hmtest.de \\
    --eab-kid "${id}" \\
    --eab-hmac-key "${key_bytes}"`;

        const issue_acme_sh = `acme.sh --issue \\
    --standalone \\
    --keylength ec-256 \\
    --server https://acme.hmtest.de/acme/acme/directory \\
    -d dummy.hmtest.de`;

        const certbot = `certbot certonly \\
    --standalone --non-interactive --agree-tos --email noreply@hmtest.de \\
    --server https://acme.hmtest.de/acme/acme/directory  \\
    --key-type ecdsa \\
    --eab-kid ${id} \\
    --eab-hmac-key ${key_bytes} \\
    --domain dummy.hmtest.de `;

        return <Modal open={this.props.token != undefined} onClose={() => { this.props.onClose(); }} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
            <Box sx={RecommendedConfigurationsComponent.style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Empfohlene Konfigurationen
                </Typography>
                <Box sx={{ height: 600 }}>
                    Regeistrierung acme.sh
                    <pre>
                        <code style={{ width: "100%" }}>
                            {register_acme_sh}
                        </code>
                    </pre>
                    Zertifikatzbezug acme.sh
                    <pre>
                        <code style={{ width: "100%" }}>
                            {issue_acme_sh}
                        </code>
                    </pre>
                    Zertifikatzbezug certbot
                    <pre>
                        <code style={{ width: "100%" }}>
                            {certbot}
                        </code>
                    </pre>
                </Box>
            </Box>
        </Modal>;
    }
}