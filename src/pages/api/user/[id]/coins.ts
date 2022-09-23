import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../../util";

interface ResponseData {
    status: number
    message: string
    data?: any
}

// const THRESHOLD = 1000 * 60 * 60 * 5; // five hours
const THRESHOLD = 1000; // five hours
const REWARD = 18; // 18 * 90 = 1620

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "POST") {
        if(utils.validateToken(req, res) === false) return;
        const { client } = await utils.connectToDB();
        const { amount = "0" } = req.body;
        const id = req.query.id as string;

        const addAmount = isNaN(parseInt(amount)) ? 0 : parseInt(amount);


        const userExists = await utils.verifyDb(id);
        if (userExists) {
            const users = client.db("db").collection<UserProfile>("users");
            const user = await users.findOneAndUpdate({ id }, { $inc: { coins: addAmount } });
            res.status(200).json({ status: 200, message: "Success", data: { old: user.value?.coins, new: (user.value?.coins ?? 0) + addAmount } });
        } else {
            res.status(500).json({ status: 500, message: "Internal Server Error" });
        }
        
    } else if (req.method === "GET") {
        const { client } = await utils.connectToDB();
        const id = req.query.id as string;

        const userExists = await utils.verifyDb(id);
        if (userExists) {
            const users = client.db("db").collection<UserProfile>("users");
            const user = await users.findOne({ id });
            res.status(200).json({ status: 200, message: "Success", data: { coins: user?.coins } });
        } else {
            res.status(500).json({ status: 500, message: "Internal Server Error" });
        }
    } else {
        res.status(405).json({ status: 405, message: "Method not allowed" });
    }
    return res.end();
}
