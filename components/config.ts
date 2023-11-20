export class Config {
    static DomainHost: string = process.env.DOMAIN_HOST ?? process.env.NEXT_PUBLIC_DOMAIN_HOST ?? "https://domain.api.example.edu";
    static PkiHost: string = process.env.PKI_HOST ?? process.env.NEXT_PUBLIC_PKI_HOST ?? "https://pki.api.example.edu";
    static EabHost: string = process.env.EAB_HOST ?? process.env.NEXT_PUBLIC_EAB_HOST ?? "https://eab.api.example.edu";
    static AcmeHost: string = process.env.ACME_HOST ?? process.env.NEXT_PUBLIC_ACME_HOST ?? "https://acme.example.edu";
    static DocsUrl: string = (process.env.DOCS_URL ?? process.env.NEXT_PUBLIC_DOCS_URL ?? "https://wiki.example.edu").replace("'", "");
    static OrganizationName: string = process.env.ORGANIZATION_NAME ?? process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Example University";
    static RefetchInBackground: boolean = (process.env.REFETCH_IN_BACKGROUND ?? process.env.NEXT_PUBLIC_REFETCH_IN_BACKGROUND ?? "false") === "true";
    static DisableDomain: boolean = (process.env.DISABLE_DOMAIN ?? process.env.NEXT_PUBLIC_DISABLE_DOMAIN ?? "false") === "true";
    static DisableServer: boolean = (process.env.DISABLE_SERVER ?? process.env.NEXT_PUBLIC_DISABLE_SERVER ?? "false") === "true";
    static DisableUser: boolean = (process.env.DISABLE_USER ?? process.env.NEXT_PUBLIC_DISABLE_USER ?? "false") === "true";
    static DisableAcme: boolean = (process.env.DISABLE_ACME ?? process.env.NEXT_PUBLIC_DISABLE_ACME ?? "false") === "true";
}

export interface AuthProps {
    accessToken: string;
    user: {
        name: string;
        email: string;
    };
    expires: string;
}
