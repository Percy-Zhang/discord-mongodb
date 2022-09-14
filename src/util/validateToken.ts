import type { NextApiRequest, NextApiResponse } from "next";

export function validateToken(req: NextApiRequest, res: NextApiResponse) {
    const token = req.headers.authorization;
    if (token === undefined || token !== "Basic 31415") {
        res.status(401).json({ status: 401, message: "Unauthorised" });
        res.end();
        return false;
    } else {
        return true;
    }
}
