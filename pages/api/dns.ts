/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import dns from "node:dns";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        res.status(401).json({ message: "You must be logged in." });
        return;
    }
    const body = JSON.parse(req.body);
    dns.resolve(body.fqdn, "A", (err, addresses) => {
        if (err) {
            res.status(500).json({ message: "Error resolving DNS" });
            return;
        }
        if (addresses.length === 0) {
            res.status(200).json({ found: false });
            return;
        }
        res.status(200).json({ found: true });
    });
    
}

export default handler;
