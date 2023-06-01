import "./index.scss";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/fira-mono/400.css";
import "@fontsource/fira-mono/500.css";
import "@fontsource/fira-mono/700.css";
import { SessionProvider } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import Container from "@mui/material/Container";
import ButtonAppBar from "@/components/navbar";
import { createEmotionCache, theme } from "@/components/theme";
import { styled } from "@mui/material/styles";
import { Session } from "next-auth";
import { NextComponentType, NextPageContext } from "next";
import { Router } from "next/router";
import Head from "next/head";
import { CacheProvider, EmotionCache } from "@emotion/react";
import AutoLogout from "@/components/autoLogout";
import { Config } from "@/components/config";

const clientSideEmotionCache = createEmotionCache();
const Offset = styled("div")(({ theme }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});
function App({ Component, pageProps: { ...pageProps }, emotionCache = clientSideEmotionCache }: { pageProps: { session: Session } } & {
    Component: NextComponentType<NextPageContext, unknown, Record<string, unknown>>;
    router: Router;
    __N_SSG?: boolean;
    __N_SSP?: boolean;
    __N_RSC?: boolean;
} & { emotionCache: EmotionCache }) {

    return <SessionProvider session={pageProps.session} refetchInBackground={Config.RefetchInBackground} refetchInterval={60} >
        <Head>
            <title>{Config.OrganizationName + " PKI-Portal"}</title>
        </Head>
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                <ButtonAppBar />
                <AutoLogout />
                <Offset />
                <Container sx={{ paddingTop: "10px", paddingBottom: "10px" }} maxWidth="xl" >
                    <Component {...pageProps} />
                </Container>
            </ThemeProvider>
        </CacheProvider>
    </SessionProvider >;
}

export default App;
