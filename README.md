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

| Variable | Description | Example Value | 
| --- | --- | --- |
| NEXTAUTH_URL | | | 
| NEXT_PUBLIC_AUTH_IDP | | | 
| NEXT_PUBLIC_EAB_HOST | | | 
| NEXT_PUBLIC_PKI_HOST | | | 
| NEXT_PUBLIC_DOMAIN_HOST | | | 
| NEXT_PUBLIC_SENTRY_DSN | | | 

## Runtime Variables

| Variable | Description | Example Value | 
| --- | --- | --- |
| AUTH_CLIENT_ID | | | 
| AUTH_CLIENT_SECRET | | | 
| AUTH_IDP | | | 
| AUTH_RESOURCE | | | 
| AUTH_SECRET | | | 
| NEXTAUTH_URL | | | 
| SENTRY_DSN | | | 