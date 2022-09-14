import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDB } from "../../util/mongodb";

type Data = {
    result: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    await connectToDB();
    res.status(200).json({ result: "Successfully connected" });
}
