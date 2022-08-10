import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import theme from "./theme";

afterEach(() => {
    // cleanup on exiting
    jest.clearAllMocks();
});

test("renders App", async () => {
    render(
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <App />
        </ThemeProvider>);

    expect(screen.getByText("Anmelden")).toBeInTheDocument();

});
