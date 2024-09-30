import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { GridRowId } from "@mui/x-data-grid";
import { useRef } from "react";

import { PortalApisSslCertificateDetails } from "@/api/pki/api";

interface CertificateRevokeDialogProps {
    open: boolean;
    onClose: () => void;
    onRevoke: (reason: string) => void;
    selected: readonly GridRowId[] | undefined;
    certificates: PortalApisSslCertificateDetails[];
}

const CertificateRevokeDialog = ({ open, onClose, onRevoke, selected, certificates }: CertificateRevokeDialogProps) => {
    const reason = useRef<TextFieldProps>(null);

    const handleRevoke = () => {
        if (reason.current?.value) {
            onRevoke(reason.current.value as string);
        }
    };

    const selectedCert = selected && certificates.find((cert) => cert.serial === selected.at(0));

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
                variant="standard"
            />
        </DialogContent>
        <DialogActions>
            <Button key="cancel" variant="outlined" color="inherit" onClick={onClose}>Abbrechen</Button>
            <Button key="revoke" variant="outlined" color="warning" onClick={handleRevoke}>Widerrufen</Button>
        </DialogActions>
    </Dialog>;
};

export default CertificateRevokeDialog;
