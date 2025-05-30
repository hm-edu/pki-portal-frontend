import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { useRef, useState } from "react";

import { PortalApisSslCertificateDetails } from "@/api/pki/api";

interface CertificateRevokeDialogProps {
    open: boolean;
    onClose: () => void;
    onRevoke: (reason: string) => void;
    selected: GridRowSelectionModel|undefined;
    certificates: PortalApisSslCertificateDetails[];
}

const CertificateRevokeDialog = ({ open, onClose, onRevoke, selected, certificates }: CertificateRevokeDialogProps) => {
    const reason = useRef<TextFieldProps>(null);
    const [noReason, setNoReason] = useState(true);

    const handleRevoke = () => {
        if (reason.current?.value) {
            onRevoke(reason.current.value as string);
        }
    };

    const selectedCert = selected && certificates.find((cert) => cert.serial === Array.from(selected.ids).at(0));

    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>SSL Zertifikat widerrufen</DialogTitle>
        <DialogContent>
            <DialogContentText>
                    Sie möchten das SSL Zertifikat mit Seriennummer {selectedCert?.serial} widerrufen.
                    Bitte geben Sie einen Grund ein.
            </DialogContentText>
            <TextField
                inputRef={reason}
                autoFocus
                margin="dense"
                id="reason"
                label="Grund"
                fullWidth
                required
                onChange={(e) => setNoReason(e.target.value === "")}
                variant="standard"
            />
        </DialogContent>
        <DialogActions>
            <Button key="cancel" variant="outlined" color="inherit" onClick={onClose}>Abbrechen</Button>
            <Button key="revoke" variant="outlined" color="warning" disabled={noReason} onClick={handleRevoke}>Widerrufen</Button>
        </DialogActions>
    </Dialog>;
};

export default CertificateRevokeDialog;
