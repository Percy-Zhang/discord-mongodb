import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../../util";

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
        const id = req.query.id as string;
        const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
        const { client } = await utils.connectToDB();

        const dbExists = await utils.verifyDb(id as string);
        if (!dbExists) return res.status(404).json({ status: 404, message: "User does not exist" });

        const character = await client.db(id).collection<Character>("characters").findOne({ name });
        if (character === null) return res.status(404).json({ status: 404, message: "Cannot find character" });

        const charStats = await utils.getCharStats(id, name as string);
    
        res.status(200).json({ status: 200, message: "Success", data: charStats });
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route" });
    }
    res.end();
}
