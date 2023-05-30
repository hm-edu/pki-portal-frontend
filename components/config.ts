export class Config {
    static DomainHost: string = process.env.DOMAIN_HOST ?? process.env.NEXT_PUBLIC_DOMAIN_HOST ?? "https://domain.api.example.edu";
    static PkiHost: string = process.env.PKI_HOST ?? process.env.NEXT_PUBLIC_PKI_HOST ?? "https://pki.api.example.edu";
    static EabHost: string = process.env.EAB_HOST ?? process.env.NEXT_PUBLIC_EAB_HOST ?? "https://eab.api.example.edu";
    static AcmeHost: string = process.env.ACME_HOST ?? process.env.NEXT_PUBLIC_ACME_HOST ?? "https://acme.example.edu";
}

export interface AuthProps {
    accessToken: string;
    user: {
        name: string;
        email: string;
    };
    expires: string;
}
