import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import App from "./App";
import theme from "./theme";

test("renders App", async () => {
    render(
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <App />
        </ThemeProvider>);
    const linkElement = screen.getByText(/Anmelden/i);

    await waitFor(() => {
        expect(linkElement).toBeInTheDocument();
    });
});
