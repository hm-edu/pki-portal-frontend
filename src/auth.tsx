import { gsspWithNonce } from "@next-safe/middleware/dist/document";
import { IncomingMessage, ServerResponse } from "http";
import { unstable_getServerSession } from "next-auth";
import { NextApiRequestCookies } from "next/dist/server/api-utils";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { AuthProps } from "./config";

async function loadSession(context: { req: IncomingMessage & { cookies: NextApiRequestCookies }; res: ServerResponse }): Promise<{ props: { session: AuthProps | null } }> {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);
    const data = session?.accessToken ? { accessToken: session.accessToken, user: { name: session.user.name ?? "", email: session.user.email ?? "" } } : null;
    return {
        props: {
            session: data,
        },
    };
}
export const getServerSideProps = gsspWithNonce(async (ctx) => { return await loadSession(ctx); });