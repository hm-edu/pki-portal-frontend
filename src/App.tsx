import "./App.css";
import React from "react";
import ButtonAppBar from "./components/navbar";
import Profile from "./components/profile";
import Login from "./components/login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import { Container } from "@mui/material";
import { styled } from "@mui/system";
import Domains from "./components/domains";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./auth/msal";

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
            <Container style={{ paddingTop: "10px" }} maxWidth="xl">
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/profile' element={<Profile />} />
                    <Route path='/domains' element={<Domains />} />
                    <Route path='/oidc-callback' element={<Login />} />
                </Routes>
            </Container>
        </BrowserRouter>
    </MsalProvider>;
}
export default App;
