import { FileDownload } from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Typography, Button } from "@mui/material";
import { Box } from "@mui/system";

interface KeySegmentProps {
    label: string;
    fileName: string;
    segment: string;
}

const KeySegment = ({ label, fileName, segment }: KeySegmentProps) => {
    const columnStyle = {
        flex: "auto",
        minWidth: "49%",
        maxWidth: "100%",
        display: "flex",
        height: "100%",
        gap: "5px",
        flexDirection: "column",
        alignContent: "flex-start",
    };

    return <Box sx={columnStyle}>
        <Typography variant="h6">{label}</Typography>
        <Button color="inherit" variant="outlined" startIcon={<FileDownload />} download={fileName} href={"data:application/x-pem-file;base64," + Buffer.from(segment).toString("base64")}>Herunterladen</Button>
        <code style={{ overflow: "auto", overflowX: "scroll", whiteSpace: "pre-wrap" }}>{segment}</code>
        <Button color="inherit" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { void navigator.clipboard.writeText(segment); }}>In die Zwischenablage kopieren</Button>
    </Box>;
};
export default KeySegment;
