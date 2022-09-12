import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDB } from "../../util/mongodb";

type Data = {
    data: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const { client } = await connectToDB();
    
    const users = client.db("db").collection("users");
    const data = await users.findOne({ id: "399733983295832086" });
    
    res.status(200).json({ data });
}
