export class Config {
    static DOMAIN_HOST: string =
        process.env.DOMAIN_HOST ?? "https://domain.api.hm.edu";
    static PKI_HOST: string =
        process.env.PKI_HOST ?? "https://pki.api.hm.edu";
    static EAB_HOST: string =
        process.env.EAB_HOST ?? "https://eab.api.hm.edu";
    static ACME_HOST: string =
        process.env.ACME_HOST ?? "https://acme.hm.edu";
}

export interface AuthProps {
    accessToken: string;
    user: {
        name: string;
        email: string;
    };
    expires: string;
}
