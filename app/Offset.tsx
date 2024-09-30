"use client";

import { Box, useTheme } from "@mui/material";

const Offset = () => {
    const theme = useTheme();
    return <Box sx={{ paddingTop: theme.mixins.toolbar }} />;
};

export default Offset;
