export class Config {
    static DOMAIN_HOST: string =
        process.env.DOMAIN_HOST ?? "https://domain.api.hmtest.de";
    static PKI_HOST: string =
        process.env.PKI_HOST ?? "https://pki.api.hmtest.de";
    static EAB_HOST: string =
        process.env.EAB_HOST ?? "https://eab.api.hmtest.de";
}

export const IDP = process.env.AUTH_IDP ?? "https://idp.hmtest.de";

export interface AuthProps {
    accessToken: string;
}
