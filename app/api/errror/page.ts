/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
    try {
        const envelope = await req.text();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const pieces = envelope.split("\n");
        const header = JSON.parse(pieces[0]);
        // DSNs are of the form `https://<key>@o<orgId>.ingest.sentry.io/<projectId>`
        const { host, pathname } = new URL(header.dsn);

        if (header.dsn != process.env.NEXT_PUBLIC_SENTRY_DSN) {
            throw new Error("Invalid DSN");
        }

        // Remove leading slash
        const projectId = pathname.substring(1);

        const sentryIngestURL = `https://${host}/api/${projectId}/envelope/`;
        const sentryResponse = await fetch(sentryIngestURL, { method: "POST", body: envelope });
        return new NextResponse(sentryResponse.body, { status: sentryResponse.status });
    } catch (e) {
        return NextResponse.json({ status: "invalid request" }, { status: 400 });
    }
}

export { handler as POST };
