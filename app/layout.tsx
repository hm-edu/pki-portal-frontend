import "@/app/index.scss";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/fira-mono/400.css";
import "@fontsource/fira-mono/500.css";
import "@fontsource/fira-mono/700.css";
import { CssBaseline, Container , ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";

import NextAuthProvider from "@/app/context/NextAuthProvider";
import Offset from "@/app/Offset";
import AutoLogout from "@/components/autoLogout";
import { Config } from "@/components/config";
import ButtonAppBar from "@/components/navbar";
import { theme } from "@/components/theme";
export const metadata = {
    title: Config.OrganizationName + " PKI-Portal",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                        <CssBaseline />

                        <NextAuthProvider>
                            <ButtonAppBar />
                            <AutoLogout />
                            <Offset />
                            <Container sx={{ paddingTop: "10px", paddingBottom: "10px" }} maxWidth="xl" >
                                {children}
                            </Container>
                        </NextAuthProvider>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
