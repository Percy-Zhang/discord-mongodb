import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDB } from "../../../../util/mongodb";

interface ResponseData {
    status: number
    message: string
    data: null | UserProfile
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "GET") {
        const id = req.query.id;

        const { client } = await connectToDB();
        const users = client.db("db").collection<UserProfile>("users");
        const profile = await users.findOne({ id });
        
        if (profile !== null) {
            res.status(200).json({ status: 200, message: "Success", data: profile  });
            return res.end();
        } else {
            res.status(404).json({ status: 404, message: "User does not exist", data: null });
            return res.end();
        }
    } else {
        res.status(405).json({ status: 405, message: "Method not allowed", data: null });
        return res.end();
    }
}
