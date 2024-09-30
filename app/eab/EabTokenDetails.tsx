import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";
import Moment from "react-moment";

import { ModelsEAB } from "@/api/eab/api";
import EabRecommendation from "@/components/EabRecommendation";

interface TokenDetailsProps {
    token: ModelsEAB | undefined;
}

const EabTokenDetails = ({ token }: TokenDetailsProps) => {
    const selectionHandler = (e: FormEvent<Element>): void => {
        const r = new Range();
        r.setStart(e.currentTarget, 0);
        r.setEnd(e.currentTarget, 1);
        document.getSelection()?.removeAllRanges();
        document.getSelection()?.addRange(r);
    };

    const [recommendations, setRecommendations] = useState(false);

    const tdStyle = {
        padding: "0px",
        height: "36px",
    };
    return <Box sx={{ px: 0, py: 1 }}>
        <Typography variant="h6" component="h2">
            Details
        </Typography>
        <Table size="small" aria-label="a dense table">
            <TableBody>
                <TableRow>
                    <TableCell sx={{ width: "200px", ...tdStyle }} ><b>EAB-ID</b></TableCell>
                    <TableCell sx={tdStyle} ><code onDoubleClick={selectionHandler}>{token?.id}</code></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ width: "200px", ...tdStyle }} ><b>HMAC-Key</b></TableCell >
                    <TableCell sx={tdStyle} >{token?.key_bytes && <code onDoubleClick={selectionHandler}>{token.key_bytes}</code>}</TableCell >
                </TableRow>
                <TableRow>
                    <TableCell sx={{ width: "200px", ...tdStyle }}><b>ACME Account verknüpft am:</b></TableCell >
                    <TableCell sx={tdStyle} >{token?.bound_at && <Moment format="DD.MM.YYYY HH:mm">{token?.bound_at}</Moment>}</TableCell >
                </TableRow>
                <TableRow>
                    <TableCell sx={tdStyle} colSpan={2}>
                        <Button sx={{ width: "100%" }} startIcon={<AutoFixHighIcon />} color="success" variant="contained" onClick={() => setRecommendations(true)}>
                            Konfigurationsempfehlungen
                        </Button>
                    </TableCell >
                </TableRow>
            </TableBody>
        </Table>
        {recommendations && <EabRecommendation onClose={() => setRecommendations(false)} token={token} />}
    </Box>;
};

export default EabTokenDetails;
