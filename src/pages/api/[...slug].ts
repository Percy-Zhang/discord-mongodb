import type { NextApiRequest, NextApiResponse } from "next";

interface ResponseData {
    status: number
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    res.status(405).json({ status: 405, message: "Incorrect route" });
    return res.end();
}
