import type { NextApiRequest, NextApiResponse } from "next";

import { connectToDB } from "../../../../util/mongodb";
import { verifyDb } from "../../../../util/verifyDb";

interface ResponseData {
    status: number
    message: string
    data?: boolean
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        const { client } = await connectToDB();
        let { id = "" } = req.query;
        id = Array.isArray(id) ? id[0] : id;
        const userAlreadyExists = await verifyDb(id);

        if (userAlreadyExists){
            res.status(200).json({ status: 200, message: "User exists", data: true });
        } else {
            res.status(200).json({ status: 200, message: "User does not exist", data: false });
        }
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route" });
    }
    return res.end();
}
