/* eslint-disable @typescript-eslint/no-non-null-assertion */
import NextAuth, { NextAuthOptions } from "next-auth";
import jwt_decode from "jwt-decode";
import { JWT } from "next-auth/jwt";
import { OAuthConfig } from "next-auth/providers";

const idp = process.env.AUTH_IDP ?? "https://idp.hmtest.de";

export const authOptions: NextAuthOptions =
{
    secret: process.env.AUTH_SECRET ?? "this_too_should_be_ch4ng3d",
    providers: [
        {
            id: "oidc",
            name: "oidc",
            type: "oauth",
            checks: ["pkce"],
            clientId: "portal-frontend-dev",
            clientSecret: process.env.AUTH_CLIENT_SECRET ?? "this_too_should_be_ch4ng3d",
            issuer: {
                jwks_uri: `${idp}/idp/profile/oidc/keyset`,
                issuer: `${idp}`,
            },
            token: `${idp}/idp/profile/oidc/token`,
            authorization: {
                url: `${idp}/idp/profile/oidc/authorize`,
                params: { scope: "openid profile email offline_access Certificates EAB Domains ", resource: "https://api.hmtest.de" },
            },
            userinfo: `${idp}/idp/profile/oidc/userinfo`,
            profile(_profile, tokens) {
                if (!tokens.access_token) {
                    return { id: "", name: "", email: "" };
                }
                const act: { sub: string; email: string; name: string } = jwt_decode(tokens.access_token);
                return {
                    id: act.sub,
                    name: act.name,
                    email: act.email,
                };
            },
        },
    ],
    jwt: {
        maxAge: 30 * 60, // 30 minutes
    },
    session: {
        maxAge: 30 * 60, // 30 minutes
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
                    accessToken: account.access_token,
                    accessTokenExpires: account.expires_at! * 1000,
                    refreshToken: account.refresh_token,
                    error: undefined,
                    user,
                };
            }
            // Return previous token if the access token has not expired yet
            if (Date.now() < token.accessTokenExpires - (60 * 1000 * 2.5)) {
                return token;
            }
            // Access token has expired, try to update it
            return await refreshAccessToken(token);
        },
        session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            session.error = token.error;
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

        const refreshedTokens = await response.json() as { access_token: string; expires_at: number; refresh_token: string };
        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: refreshedTokens.expires_at * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
            error: undefined,
        };
    } catch (error) {
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export default NextAuth(authOptions);