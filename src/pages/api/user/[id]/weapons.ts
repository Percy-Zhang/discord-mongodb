import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDb } from "../../../../util/verifyDb";
import { connectToDB } from "../../../../util/mongodb";
import validatePaginateQuery from "../../../../util/validatePaginateQuery";

interface ResponseData {
    status: number
    message: string
    data: Response
}

type Response = null | Weapon[]

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        const { id, name, rarity, type, weaponId, page = "1", paginate = "10" } = req.query;
        let weapons : Response = [];
        let dbExists = true;

        const validPaginate = typeof paginate === "string" ? paginate : "10";
        let skip = validatePaginateQuery(page, paginate);

        const { client } = await connectToDB();
        if (typeof id === "string") {
            dbExists = await verifyDb(id);
            const collection = client.db(id).collection<Weapon>("weapons");
            const find = {} as any;
            if (typeof name === "string") find.name = name;
            if (typeof rarity === "string") find.rarity = parseInt(rarity);
            if (typeof weaponId === "string") find.id = parseInt(weaponId);
            if (typeof type === "string") find.type = type;
            weapons = await collection
                .find(find)
                .sort({ level: -1, refinement: -1 , type: 1, name: 1 })
                .skip(skip)
                .limit(parseInt(validPaginate, 10))
                .toArray();
        }
        
        if (dbExists === false){
            res.status(404).json({ status: 404, message: "User does not exist", data: null });
        } else if (weapons !== null) {
            res.status(200).json({ status: 200, message: "Success", data: weapons });
        } else {
            res.status(500).json({ status: 500, message: "Internal server error", data: null });
        }
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route", data: null });
    }
    return res.end();
}
