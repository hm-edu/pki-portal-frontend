import React from "react";
import type { AuthContextProps } from "react-oidc-context";
import { loggedIn } from "../helper/loggedIn";

class Domains extends React.Component<AuthContextProps> {
    render() {        
        return <h1>Test</h1>;
    }
}

export default loggedIn(Domains);