"use client";

import { DialogTitle, DialogContent, DialogContentText, Typography, DialogActions, Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

import { EABApi } from "@/api/eab/api";
import { Configuration } from "@/api/eab/configuration";
import { Config } from "@/components/config";

interface EabDeleteDialogProps {
    initOpen: boolean;
    accessToken: string;
    id: string;
    callback: (sucess: boolean) => void;
}
const EabDeleteDialog = ({ initOpen, accessToken, id, callback }: EabDeleteDialogProps) => {

    function removeEAB(id: string, accessToken: string, callback: (success: boolean) => void) {
        const cfg = new Configuration({ accessToken: accessToken });
        const api = new EABApi(cfg, `${Config.EabHost}`);
        api.eabIdDelete(id).then(() => callback(true) ).catch((error) => {
            Sentry.captureException(error);
        });
    }
    const [open, setOpen] = useState(initOpen);
    return <Dialog open={open} id="toBeDeleted" onClose={() => { setOpen(false); callback(false); }}>
        <DialogTitle>ACME Token löschen</DialogTitle>
        <DialogContent>
            <DialogContentText>
                <Typography>
                    Sie möchten den ACME Token {id} löschen.
                </Typography>
                <Typography>
                    Dieser Vorgang kann nicht rückgängig gemacht werden. Die betreffenden Server werden nicht mehr in der Lage sein, Zertifikate zu beziehen oder zu erneuern.
                </Typography>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button variant="outlined" color="inherit" onClick={ () => callback(false) } >
                Abbrechen
            </Button>
            <Button variant="outlined" color="warning" onClick={() => removeEAB(id, accessToken, callback) }>
                Löschen{" "}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default EabDeleteDialog;
