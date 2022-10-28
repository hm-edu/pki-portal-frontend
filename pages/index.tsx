import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function Home() {
    return (
        <Box>
            <Typography variant="h1" sx={{ textAlign: "center" }}>
                Herzlich Willkommen zum PKI-Portal der Hochschule München
            </Typography>
        </Box>
    );
}
