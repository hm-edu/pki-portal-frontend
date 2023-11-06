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

| Variable                          | Description                                                    | Example Value                    & Default |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| NEXTAUTH_URL                      | The canonical URL of your site                                 | `https://pki.example.edu`                  |
| NEXT_PUBLIC_AUTH_IDP              | The IDP that shal be used for OIDC authentication              | `https://sso.example.edu`                  |
| NEXT_PUBLIC_EAB_HOST              | The API backend host for EAB Operations                        | `https://eab.api.example.edu`              |
| NEXT_PUBLIC_PKI_HOST              | The API backend host for PKI Operations                        | `https://pki.api.example.edu`              |
| NEXT_PUBLIC_DOMAIN_HOST           | The API backend host for Domain Operations                     | `https://domain.api.example.edu`           |
| NEXT_PUBLIC_ACME_HOST             | The host for ACME Operations                                   | `https://acme.example.edu`                 |
| NEXT_PUBLIC_DOCS_URL              | The url for some docs                                          | `https://wiki.pki.example.edu`             |
| NEXT_PUBLIC_SENTRY_DSN            | In case of using sentry the sentry DSN to upload error reports |                                            |
| NEXT_PUBLIC_ORGANIZATION_NAME     | The name of your organization                                  | Example University                         |
| NEXT_PUBLIC_REFETCH_IN_BACKGROUND | Whether the session shall be refreshed in background or not    | false                                      |
| LOGO_LARGE                        | Link to the large logo for the titlepage                       |                                            |
| LOGO_SMALL                        | Link to the small logo for the navbar                          |                                            |
| FAVICON                           | Link to the favion                                             |                                            |

## Runtime Variables

| Variable           | Description                                                                                          | Example Value             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------- |
| AUTH_CLIENT_ID     | The OIDC Client ID                                                                                   | `pki`                     |
| AUTH_CLIENT_SECRET | The OIDC Client Secret                                                                               | `Random String`           |
| AUTH_IDP           | The IDP that shal be used for OIDC authentication (Should be the same as during build time)          | `https://sso.example.edu` |
| AUTH_RESOURCE      | The requested OIDC resource to get OAuth2 working.                                                   | `https://api.example.edu` |
| AUTH_SECRET        | The [Next.JS Auth Secret](https://next-auth.js.org/configuration/options#secret) used to encrypt JWT | `Random String            |
| NEXTAUTH_URL       | The canonical URL of your site (Should be the same as during build time)                             | `https://pki.example.edu` |
| SENTRY_DSN         | In case of using sentry the sentry DSN to upload error reports                                       |                           |
