import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";

import logo from "../public/logo.png";

import { Config } from "@/components/config";

const Home = () => {
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
                alt="Logo"
            />
            <Typography variant="h1" sx={{ textAlign: "center" }}>
                PKI-Portal der {Config.OrganizationName}
            </Typography>
        </Box>
    );
};

export default Home;
