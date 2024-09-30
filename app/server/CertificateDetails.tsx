import Box from "@mui/material/Box";
import Moment from "react-moment";

import { PortalApisSslCertificateDetails } from "@/api/pki/api";

interface CertificateDetailsProps {
    cert: PortalApisSslCertificateDetails;
}

const CertificateDetails = ({ cert }: CertificateDetailsProps) => {
    return <Box sx={{ px: 1, py: 1 }}>
        <table>
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
            </tbody>
        </table>
    </Box>;
};

export default CertificateDetails;
