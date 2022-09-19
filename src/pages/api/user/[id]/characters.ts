import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDb } from "../../../../util/verifyDb";
import { connectToDB } from "../../../../util/mongodb";
import validatePaginateQuery from "../../../../util/validatePaginateQuery";

interface ResponseData {
    status: number
    message: string
    data: Response
}

type Response = null | Character[]

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        let { id, name, page = "1", paginate = "10" } = req.query;
        let characters : Response = [];
        let dbExists = true;

        paginate = typeof paginate === "string" ? paginate : "10";
        let skip = validatePaginateQuery(page, paginate);

        const { client } = await connectToDB();
        if (typeof id === "string") {
            dbExists = await verifyDb(id);
            const collection = client.db(id).collection<Character>("characters");
            const find = name ? { name } : {};
            characters = await collection
                .find(find)
                .sort({ level: -1, rarity: -1, name: 1 })
                .skip(skip)
                .limit(parseInt(paginate, 10))
                .toArray();
        }
        
        if (dbExists === false){
            res.status(404).json({ status: 404, message: "User does not exist", data: null });
        } else if (characters !== null) {
            res.status(200).json({ status: 200, message: "Success", data: characters });
        } else {
            res.status(500).json({ status: 500, message: "Internal server error", data: null });
        }
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route", data: null });
    }
    return res.end();
}
