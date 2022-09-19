import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDb } from "../../../../util/verifyDb";
import { connectToDB } from "../../../../util/mongodb";
import validatePaginateQuery from "../../../../util/validatePaginateQuery";

interface ResponseData {
    status: number
    message: string
    data: Response
}

type Response = null | Artifact[]

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        const { page = "1", paginate = "10" } = req.query;
        const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
        const set = Array.isArray(req.query.set) ? req.query.set[0] : req.query.set;
        const type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;

        let artifacts : Response = [];
        let dbExists = true;

        const validPaginate = typeof paginate === "string" ? paginate : "10";
        let skip = validatePaginateQuery(page, paginate);

        const { client } = await connectToDB();
        if (id !== undefined) {
            dbExists = await verifyDb(id);
            const collection = client.db(id).collection<Artifact>("artifacts");
            const find = {} as any;
            if (set !== undefined) find.set = set;
            if (type !== undefined) find.type = type;
            artifacts = await collection
                .find(find)
                .sort({ set: 1, type: 1, level: -1 })
                .skip(skip)
                .limit(parseInt(validPaginate, 10))
                .toArray();
        }

        if (dbExists === false){
            res.status(404).json({ status: 404, message: "User does not exist", data: null });
        } else if (artifacts !== null) {
            res.status(200).json({ status: 200, message: "Success", data: artifacts });
        } else {
            res.status(500).json({ status: 500, message: "Internal server error", data: null });
        }
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route", data: null });
    }
    return res.end();
}
