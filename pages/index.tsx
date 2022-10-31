import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Image from "next/image";
import logo from "../public/logo.png";

export default function Home() {
    return (
        <Box
            sx={{ height: "100%" }}
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
        >
            <Image
                src={logo}
                height={200}
                width={200 * (2000 / 923)}
                alt="Logo"
            />
            <Typography variant="h1" sx={{ textAlign: "center" }}>
                PKI-Portal der Hochschule München
            </Typography>
        </Box>
    );
}
