# PKI-Portal @ hm.edu

This repository contains all required sources for building the PKI-Portal running at Munich University of Applied Sciences.
The techstack is built out of the following components:

 - Next.JS 13
 - Material UI using MUI
 - Sentry Error Reporting
 - PKI.js for client-side cryptography

## Getting Started

Due to the usage of Next.JS and Sentry several environment variables and flags must be set at build time and during runtime.

## Build Time Variables

At development and during building a compiled version or a container, the following variables must be set and configured.

| Variable                | Description                                                    | Example Value                    |
| ----------------------- | -------------------------------------------------------------- | -------------------------------- |
| NEXTAUTH_URL            | The canonical URL of your site                                 | `https://pki.example.edu`        |
| NEXT_PUBLIC_AUTH_IDP    | The IDP that shal be used for OIDC authentication              | `https://sso.example.edu`        |
| NEXT_PUBLIC_EAB_HOST    | The API Backend host for EAB Operations                        | `https://eab.api.example.edu`    |
| NEXT_PUBLIC_PKI_HOST    | The PKI Backend host for EAB Operations                        | `https://pki.api.example.edu`    |
| NEXT_PUBLIC_DOMAIN_HOST | The Domain Backend host for EAB Operations                     | `https://domain.api.example.edu` |
| NEXT_PUBLIC_SENTRY_DSN  | In case of using sentry the sentry DSN to upload error reports |                                  |

## Runtime Variables

| Variable           | Description                                                                                          | Example Value             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------- |
| AUTH_CLIENT_ID     | The OIDC Client ID                                                                                   | `pki`                     |
| AUTH_CLIENT_SECRET | The OIDC Client Secret                                                                               | `Random String`           |
| AUTH_IDP           | The IDP that shal be used for OIDC authentication (Should be the same as during build time)          | `https://sso.example.edu` |
| AUTH_RESOURCE      | The requested OIDC resource to get OAuth2 working.                                                   | `https://api.example.edu`  |
| AUTH_SECRET        | The [Next.JS Auth Secret](https://next-auth.js.org/configuration/options#secret) used to encrypt JWT | `Random String            |
| NEXTAUTH_URL       | The canonical URL of your site (Should be the same as during build time)                             | `https://pki.example.edu` |
| SENTRY_DSN         | In case of using sentry the sentry DSN to upload error reports                                       |                           |