import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
    idp: string;
}

export default (req: NextApiRequest, res: NextApiResponse<Data>) => {
    res.status(200).json({ idp: process.env.AUTH_IDP ?? "idp.hmtest.de" });
};
