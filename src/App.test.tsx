import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PublicClientApplication, Configuration, IPublicClientApplication } from "@azure/msal-browser";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import theme from "./theme";
let pca: IPublicClientApplication;
const msalConfig: Configuration = {
    auth: {
        clientId: "Test",
    },
};

beforeEach(() => {
    pca = new PublicClientApplication(msalConfig);
});

afterEach(() => {
    // cleanup on exiting
    jest.clearAllMocks();
});

test("renders App", async () => {
    const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
    render(
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <App instance={pca} />
        </ThemeProvider>);

    await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Anmelden")).toBeInTheDocument();

});
