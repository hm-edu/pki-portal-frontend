/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { captureException } from "@sentry/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const envelope = req.body;
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
        return res.status(sentryResponse.status).send(sentryResponse.body);
    } catch (e) {
        captureException(e);
        return res.status(400).json({ status: "invalid request" });
    }
}

export default handler;