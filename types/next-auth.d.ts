import { User } from "next-auth";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
        };
        accessToken: string | undefined;
    }
}
declare module "next-auth/jwt" {    
    interface JWT extends DefaultJWT {        
        accessToken: string | undefined;
        accessTokenExpires: number;
        refreshToken: string | undefined;
        error: string | undefined;
        user: User;
    }
}