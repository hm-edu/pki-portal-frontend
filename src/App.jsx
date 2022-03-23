import './App.css';
import React from "react";
import ButtonAppBar from './components/navbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './components/home';

import { AuthProvider } from "react-oidc-context";
const onSigninCallback = () => {
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    )
}

const host = process.env.REACT_APP_HOST;
const oidcConfig = {
    authority: process.env.REACT_APP_IDP,
    client_id: "portal-frontend-dev",
    redirect_uri: "https://" + host + "/oidc-callback",
    scope: 'openid offline_access profile',
    skipUserInfo: false,
    loadUserInfo: true,
    onSigninCallback: onSigninCallback,
};



function App() {
    return <AuthProvider {...oidcConfig}>
        <BrowserRouter>
            <ButtonAppBar />
            <Routes>
                <Route path='/' element={Home()}></Route>
                <Route path='/home' element={Home()}></Route>
            </Routes>
        </BrowserRouter>
    </AuthProvider>;
}
export default App;
