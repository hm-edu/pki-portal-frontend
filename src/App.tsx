import "./App.css";

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication } from "@azure/msal-browser";
import { Container } from "@mui/material";
import { styled } from "@mui/system";

import ButtonAppBar from "./components/navbar";
import Login from "./components/login";
import Home from "./components/home";
import Domains from "./components/domains/list";
import SslCertificates from "./components/ssl/list";
import SmimeGenerator from "./components/smime/request";
import SmimeCertificates from "./components/smime/list";
import EABTokens from "./components/eab/list";
import SslGenerator from "./components/ssl/request";

const Offset = styled("div")(({ theme }) => {
    // @ts-expect-error Property will allways be set.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});
interface AppProperties {
    instance: IPublicClientApplication;
}
function App(props: AppProperties) {
    const instance = props.instance;
    return <MsalProvider instance={instance}>
        <BrowserRouter>
            <ButtonAppBar />
            <Offset />
            <Container style={{ paddingTop: "10px" }} maxWidth="xl" >
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/domains' element={<Domains />} />
                    <Route path='/ssl' element={<SslCertificates />} />
                    <Route path='/ssl/new' element={<SslGenerator />} />
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
