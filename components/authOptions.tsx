/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as Sentry from "@sentry/nextjs";
import { jwtDecode } from "jwt-decode";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { OAuthConfig } from "next-auth/providers";

import { Config } from "@/components/config";

const idp = process.env.AUTH_IDP ?? process.env.NEXT_PUBLIC_AUTH_IDP ?? "https://sso-test.hm.edu";

class AuthProviderSuffix {
    static jwks_endpoint: string = Config.AuthProvider == "shibboleth" ? "/idp/profile/oidc/keyset" : "/protocol/openid-connect/certs";
    static token_endpoint: string = Config.AuthProvider == "shibboleth" ? "/idp/profile/oidc/token" : "/protocol/openid-connect/token";
    static userinfo_endpoint: string = Config.AuthProvider == "shibboleth" ? "/idp/profile/oidc/userinfo" : "/protocol/openid-connect/userinfo";
    static authorization_endpoint: string = Config.AuthProvider == "shibboleth" ? "/idp/profile/oidc/authorize" : "/protocol/openid-connect/auth";
}

export const authOptions: NextAuthOptions =
{
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
    },
    secret: process.env.AUTH_SECRET ?? "this_too_should_be_ch4ng3d",
    providers: [
        {
            id: "oidc",
            name: "oidc",
            type: "oauth",
            checks: ["pkce"],
            clientId: process.env.AUTH_CLIENT_ID ?? "portal-frontend-dev",
            clientSecret: process.env.AUTH_CLIENT_SECRET ?? "this_too_should_be_ch4ng3d",
            issuer: idp,
            jwks_endpoint: `${idp}${AuthProviderSuffix.jwks_endpoint}`,
            token: `${idp}${AuthProviderSuffix.token_endpoint}`,
            authorization: {
                url: `${idp}${AuthProviderSuffix.authorization_endpoint}`,
                params: {
                    scope: "openid profile email offline_access Certificates EAB Domains",
                    resource: process.env.AUTH_RESOURCE,
                    prompt: "login",
                },
            },
            userinfo: `${idp}${AuthProviderSuffix.userinfo_endpoint}`,
            profile(_profile, tokens) {
                if (!tokens.access_token) {
                    return { id: "", name: "", email: "" };
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const act: { sub: string; email: string; name: string } = jwtDecode(tokens.access_token);
                return {
                    id: act.sub,
                    name: act.name,
                    email: act.email,
                };
            },
        },
    ],
    jwt: {
        maxAge: 10 * 60, // 10 minutes
    },
    session: {
        maxAge: 10 * 60, // 10 minutes
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            return url;
        },
        async jwt({ token, user, account }): Promise<JWT> {
            // Persist the OAuth access_token to the token right after signin
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    accessTokenExpiresAt: account.expires_at!,
                    refreshToken: account.refresh_token,
                    error: undefined,
                    user,
                };
            }
            // Return previous token if the access token has not expired yet
            if (Date.now() < token.accessTokenExpiresAt - (60 * 1000 * 2.5)) {
                return token;
            }
            if (!token || !token.accessToken) {
                throw new Error("No token provided");
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const act: { sub: string; email: string; name: string } = jwtDecode(token.accessToken);
            Sentry.addBreadcrumb({
                category: "auth",
                message: `Refreshing ${act.email}'s access token`,
                level: "info",
            });
            console.log(`Refreshing ${act.email}'s access token`);
            token = await refreshAccessToken(token);
            // Access token has expired, try to update it
            return token;
        },
        session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            return session;
        },
    },
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const cfg = (authOptions.providers[0] as OAuthConfig<unknown>);
        const url = cfg.token as string;

        const response = await fetch(url, {
            headers: {
                "Authorization": "Basic " + Buffer.from(`${cfg.clientId!}:${cfg.clientSecret!}`).toString("base64"),
            },
            method: "POST",
            body: new URLSearchParams({
                client_id: cfg.clientId!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
            }),
        });

        const refreshedTokens = await response.json() as { access_token: string; expires_in: number; refresh_token: string };
        if (!response.ok) {
            throw refreshedTokens;
        }
        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
            error: undefined,
        };
    } catch (error) {
        Sentry.captureException(error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}
