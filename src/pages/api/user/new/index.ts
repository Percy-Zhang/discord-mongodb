import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDb } from "../../../../util/verifyDb";
import { connectToDB } from "../../../../util/mongodb";
import { validateToken } from "../../../../util/validateToken";

interface ResponseData {
    status: number
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "POST") {
        if(validateToken(req, res) === false) return;

        const { client } = await connectToDB();
        const { id } = req.body;
        const userAlreadyExists = await verifyDb(client, id);
        const profile = {
            id,
            name: "User",
            uid: "123456789",
            coins: 0,
            guarantee: { four: false, five: false },
            pity: { four: 0, five: 0 },
        };
        let acknowledged = false;

        if (userAlreadyExists === false) {
            const collection = client.db("db").collection("users");
            const userDb = client.db(id);
            acknowledged = (await collection.insertOne(profile)).acknowledged;
            if (acknowledged) {
                userDb.createCollection("characters");
                userDb.createCollection("artifacts");
                userDb.createCollection("weapons");
                userDb.createCollection("wishHistory", { capped: true, size: 10000000 });
            }
        }

        if (userAlreadyExists){
            res.status(404).json({ status: 404, message: "User already exists" });
        } else if (acknowledged) {
            res.status(200).json({ status: 200, message: "User successfully created" });
        } else {
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route" });
    }
    return res.end();
}
