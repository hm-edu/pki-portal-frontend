import "./index.scss";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { SessionProvider } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import Container from "@mui/material/Container";
import ButtonAppBar from "../components/navbar";
import { theme } from "../components/theme";
import { styled } from "@mui/material/styles";
import { Session } from "next-auth";
import { NextComponentType, NextPageContext } from "next";
import { Router } from "next/router";
import Head from "next/head";
import App, { AppContext } from "next/app";

const Offset = styled("div")(({ theme }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});
function MyApp({ Component, pageProps: { ...pageProps } }: { pageProps: { session: Session; idp: string } } & {
    Component: NextComponentType<NextPageContext, unknown, Record<string, unknown>>;
    router: Router;
    __N_SSG?: boolean;
    __N_SSP?: boolean;
    __N_RSC?: boolean;
}) {
    return <SessionProvider session={pageProps.session} >
        <Head>
            <title>HM Portal</title>
        </Head>
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <ButtonAppBar idp={pageProps.idp} />

            <Offset />
            <Container sx={{ paddingTop: "10px", paddingBottom: "10px" }} maxWidth="xl" >
                <Component {...pageProps} />
            </Container>
        </ThemeProvider>
    </SessionProvider >;
}

MyApp.getInitialProps = async (appContext: AppContext) => {
    const appProps = await App.getInitialProps(appContext);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    appProps.pageProps.idp = process.env.AUTH_IDP ?? "https://idp.hmtest.de";
    return { ...appProps };
};

export default MyApp;
