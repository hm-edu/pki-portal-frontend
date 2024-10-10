/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import dns from "node:dns";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/components/authOptions";

interface DnsResponse {
    found?: boolean;
    message?: string;
}

async function handler(req: NextRequest): Promise<NextResponse<DnsResponse>> {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "You must be logged in." }, { status: 401 });
    }
    const body = await req.json();
    const promisses = dns.promises;
    const resp = await (promisses.resolve(body.fqdn, "A").then(x => {
        if (x.length === 0) {
            return NextResponse.json({ found: false }, { status: 200 });
        }
        return NextResponse.json({ found: true }, { status: 200 });
    })).catch(() => {
        return NextResponse.json({ message: "Error resolving DNS" }, { status: 500 });
    });
    return resp;

}

export { handler as POST };
