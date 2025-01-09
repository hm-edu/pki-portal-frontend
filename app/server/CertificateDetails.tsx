"use client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, useMediaQuery, useTheme } from "@mui/material";
import Moment from "react-moment";

import { PortalApisSslCertificateDetails } from "@/api/pki/api";

interface CertificateDetailsProps {
    cert: PortalApisSslCertificateDetails;
    onClose: () => void;
    open: boolean;
}

const CertificateDetails = ({ cert, onClose, open }: CertificateDetailsProps) => {

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("lg"));
    return <Dialog maxWidth="lg" sx={{ px: 1, py: 1 }} open={open} onClose={onClose}
        fullScreen={fullScreen}>
        <DialogTitle sx={{ borderBottom: "1px solid lightgray" }} >Zertifikatdetails</DialogTitle>
        <DialogContent>
            <Table sx={{ my: 2 }}>
                <tbody>
                    <tr>
                        <td><b>Common Name</b></td>
                        <td>{cert.common_name}</td>
                    </tr>
                    <tr style={{ verticalAlign: "baseline" }}>
                        <td><b>Subject Alternative Names</b></td>
                        <td>{cert.subject_alternative_names?.join(", ")}</td>
                    </tr>
                    <tr>
                        <td><b>Serial</b></td>
                        <td>{cert.serial}</td>
                    </tr>
                    <tr>
                        <td><b>Gültig ab</b></td>
                        <td>{cert.not_before?.seconds && <Moment format="DD.MM.YYYY" date={new Date(cert.not_before?.seconds * 1000)}></Moment>}</td>
                    </tr>
                    <tr>
                        <td><b>Gültig bis</b></td>
                        <td>{cert.expires?.seconds && <Moment format="DD.MM.YYYY" date={new Date(cert.expires?.seconds * 1000)}></Moment>}</td>
                    </tr>
                    <tr>
                        <td><b>Erstellt</b></td>
                        <td>{cert.created?.seconds && <Moment format="DD.MM.YYYY HH:mm" date={new Date(cert.created?.seconds * 1000)}></Moment>}</td>
                    </tr>
                    <tr>
                        <td><b>Nutzer</b></td>
                        <td>{cert.issued_by}</td>
                    </tr>
                    <tr>
                        <td><b>Verfahren</b></td>
                        <td>{cert.source}</td>
                    </tr>
                    <tr>
                        <td><b>CA</b></td>
                        <td>{cert.ca}</td>
                    </tr>
                </tbody>
            </Table>
        </DialogContent>
        <DialogActions>
            <Button variant="outlined" color="inherit" onClick={onClose}>Schließen</Button>
        </DialogActions>
    </Dialog>;
};

export default CertificateDetails;
