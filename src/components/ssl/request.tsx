/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, CircularProgress, Modal, Typography } from "@mui/material";
import { green } from "@mui/material/colors";
import { Box } from "@mui/system";
import React, { useCallback, useEffect } from "react";
import { authorize } from "../../auth/api";

export default function SslGenerator() {

    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const account = useAccount(accounts[0])!;
    const [progress, setProgress] = React.useState<string>("");

    const [loading, setLoading] = React.useState(true);
    const [success, setSuccess] = React.useState(false);

    const buttonSx = {
        ...(success && {
            bgcolor: green[500],
            "&:hover": {
                bgcolor: green[700],
            },
        }), mt: 3, mb: 2,
    };
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };
    const create = useCallback((event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        event.preventDefault();
        if (!loading) {
            setSuccess(false);
            setLoading(true);
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response) => {
                if (response) {
                    setProgress("Generiere CSR...");
                }
            }, () => { setLoading(false); });
        }
    }, [account, instance, progress, loading]);

    useEffect(() => {
        setProgress("Bitte warten...");
        if (account) {
            authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Certificates", "email"], (response) => {
                if (response) {
                    setLoading(false);
                }
            }, () => { setLoading(false); });
        }
    }, [account, instance]);

    if (!isAuthenticated) {
        return <div>Please login</div>;
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return <div>
        <h1>Erstellung eines neuen SSL Zertifikats</h1>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box component="form" onSubmit={create} sx={{ display: "flex", maxWidth: "md", flexDirection: "column", alignItems: "left", alignSelf: "center" }}>
                <Button type="submit" variant="contained" disabled={loading || success} sx={buttonSx}>Generiere Zertifikat {loading && (
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                )}</Button>
            </Box>
        </Box>
        <Modal open={loading} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Generierung eines neuen SSL Zertifikats
                </Typography>
                <Box sx={{ padding: 2 }}>
                    <CircularProgress size={24} sx={{ color: green[500], position: "absolute", left: "50%", marginLeft: "-12px" }} />
                </Box>
                <Typography id="modal-modal-description" sx={{ mt: "24px" }}>
                    {progress}
                </Typography>
            </Box>
        </Modal>

    </div>;
}