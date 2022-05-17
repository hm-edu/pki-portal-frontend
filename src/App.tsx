import "./App.css";
import React from "react";
import ButtonAppBar from "./components/navbar";
import Login from "./components/login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import { Container } from "@mui/material";
import { styled } from "@mui/system";
import Domains from "./components/domains/list";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./auth/msal";
import SslCertificates from "./components/ssl/list";
import SmimeGenerator from "./components/smime/request";
import SmimeCertificates from "./components/smime/list";
import EABTokens from "./components/eab/list";

const Offset = styled("div")(({ theme }) => {
    // @ts-expect-error Property will allways be set.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});

function App() {
    const msalInstance = new PublicClientApplication(msalConfig);
    return <MsalProvider instance={msalInstance}>
        <BrowserRouter>
            <ButtonAppBar />
            <Offset />
            <Container style={{ paddingTop: "10px" }} maxWidth="xl" >
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/domains' element={<Domains />} />
                    <Route path='/ssl' element={<SslCertificates />} />
                    <Route path='/eab' element={<EABTokens />} />
                    <Route path='/smime/new' element={<SmimeGenerator />} />
                    <Route path='/smime' element={<SmimeCertificates />} />
                    <Route path='/oidc-callback' element={<Login />} />
                </Routes>
            </Container>
        </BrowserRouter>
    </MsalProvider>;
}
export default App;
