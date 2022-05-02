/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envSettings = window as any;
export class Config {
    static CLIENT_ID = envSettings.CLIENT_ID;
    static AUTHORITY = envSettings.AUTHORITY;
    static HOST: string = envSettings.HOST as string;
    static DOMAIN_HOST: string = envSettings.DOMAIN_HOST as string;
    static PKI_HOST: string = envSettings.PKI_HOST as string;
}