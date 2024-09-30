/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import dns from "node:dns";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/components/authOptions";

async function handler(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "You must be logged in." }, { status: 401 });
    }
    const body = await req.json();
    return dns.resolve(body.fqdn, "A", (err, addresses) => {
        if (err) {
            return NextResponse.json({ message: "Error resolving DNS" }, { status: 500 });
        }
        if (addresses.length === 0) {
            return NextResponse.json({ found: false }, { status: 200 });
        }
        return NextResponse.json({ found: true }, { status: 200 });
    });

}

export { handler as POST };
