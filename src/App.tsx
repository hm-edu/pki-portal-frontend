import "./App.css";
import React from "react";
import ButtonAppBar from "./components/navbar";
import Profile from "./components/profile";
import Login from "./components/login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import { Container } from "@mui/material";
import { styled } from "@mui/system";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";

const Offset = styled("div")(({ theme }) => {
    // @ts-expect-error Property will allways be set.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return theme.mixins.toolbar;
});
function App() {

    const host = String(process.env.REACT_APP_HOST);
    const authority = String(process.env.REACT_APP_IDP);
    const oidcConfig: AuthProviderProps = {
        authority: authority,
        client_id: "portal-frontend-dev",
        redirect_uri: "https://" + host + "/oidc-callback",
        scope: "openid profile",
        loadUserInfo: true,
    };
    return <AuthProvider {...oidcConfig}>
        <BrowserRouter>
            <ButtonAppBar />
            <Offset />
            <Container style={{ paddingTop: "10px" }} maxWidth="xl">
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/profile' element={<Profile />} />
                    <Route path='/oidc-callback' element={<Login />} />
                </Routes>
            </Container>
        </BrowserRouter>
    </AuthProvider>;
}
export default App;
