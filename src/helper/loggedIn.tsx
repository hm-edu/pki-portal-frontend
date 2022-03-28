import React, { ComponentType, FC, useEffect } from "react";
import { AuthContextProps, useAuth } from "react-oidc-context";

/**
 * A public higher-order component to access the imperative API
 * @public
 */
export function loggedIn<P extends AuthContextProps>(
    Component: ComponentType<P>,
): ComponentType<Omit<P, keyof AuthContextProps>> {
    const displayName = `loggedIn(${Component.displayName || Component.name})`;
    const C: FC<Omit<P, keyof AuthContextProps>> = (props) => {
        const auth = useAuth();

        if (auth.isAuthenticated) {
            return <Component {...(props as P)} {...auth} />;
        } else {
            useEffect(() => {
                if (!auth.isAuthenticated && !auth.isLoading) {
                    sessionStorage.setItem("target", window.location.pathname);
                    void auth.signinRedirect();
                }
            }, [auth]);
            return null;
        }
    };

    C.displayName = displayName;

    return C;
}