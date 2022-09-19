import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../util";

interface ResponseData {
    status: number
    message: string
    data?: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        const { client } = await utils.connectToDB();

        const monstersCol = client.db("archive").collection("monsters");
        const monsters = await monstersCol.find().toArray();

        res.status(200).json({ status: 200, message: "Success", data: monsters });
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route" });
    }
    res.end();
}
