import "./App.scss";
import React from "react";

import ButtonAppBar from "./components/navbar";
import Login from "./components/login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import { Container } from "@mui/material";
import "@fontsource/fira-mono";
import { styled } from "@mui/system";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";
import Domains from "./components/domains/list";
import SslCertificates from "./components/ssl/list";
import SmimeGenerator from "./components/smime/request";
import SmimeCertificates from "./components/smime/list";
import { EabTokens } from "./components/eab/list";
import SslGenerator from "./components/ssl/request";
import { Config } from "./config";

const Offset = styled("div")(({ theme }) => {
    // @ts-expect-error Property will allways be set.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});

function App() {
    const oidcConfig: AuthProviderProps = {
        authority: Config.AUTHORITY,
        client_id: Config.CLIENT_ID,
        redirect_uri: Config.HOST + "/oidc-callback",
        scope: "openid profile Certificates email EAB Domains",
        loadUserInfo: true,
    };
    return <AuthProvider {...oidcConfig}>
        <BrowserRouter>
            <ButtonAppBar />
            <Offset />
            <Container sx={{ paddingTop: "10px", paddingBottom: "10px" }} maxWidth="xl" >
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/domains' element={<Domains />} />
                    <Route path='/ssl' element={<SslCertificates />} />
                    <Route path='/ssl/new' element={<SslGenerator />} />
                    <Route path='/eab' element={<EabTokens />} />
                    <Route path='/smime/new' element={<SmimeGenerator />} />
                    <Route path='/smime' element={<SmimeCertificates />} />
                    <Route path='/oidc-callback' element={<Login />} />
                </Routes>
            </Container>
        </BrowserRouter>
    </AuthProvider>;
}
export default App;
