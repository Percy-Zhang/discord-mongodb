import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../../util";
import { connectToDB } from "../../../../util/mongodb";
import { verifyDb } from "../../../../util/verifyDb";

interface ResponseData {
    status: number
    message: string
    data?: any
}

const THRESHOLD = 1000 * 60 * 60 * 5; // five hours
const REWARD = 20; // 18 * 90 = 1620

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "POST") {
        if(utils.validateToken(req, res) === false) return;
        const { client } = await connectToDB();
        const { type, character, cancel = "0" } = req.body;
        const id = req.query.id as string;
        let data = { type, start: new Date() };

        // validate type
        if (type !== "commission" && type !== "domain" && type !== "expedition")
            return res.status(400).json({ status: 400, message: "Invalid type. Must be commission, domain or expedition" });

        //validate character
        const char = await client.db(id).collection<Character>("characters").findOne({ name: character });
        if (char === null) 
            return res.status(400).json({ status: 400, message: "Character is not owned" });

        const userExists = await verifyDb(id);
        if (userExists) {
            const users = client.db("db").collection<UserProfile>("users");
            const profile = await users.findOne({ id });
            if (profile === null) return res.status(500).json({ status: 500, message: "Interval server error" });
            const isOnAdv = profile.adventure.start !== null;

            if (cancel === "1") {
                const result = await users.findOneAndUpdate({ id }, { $set: { adventure: { type: null, start: null, character: null } } });
                const cancelledChar = result.value?.adventure?.character ?? null;
                return res.status(200).json({ status: 200, message: "Adventure cancelled", data: { status: isOnAdv, completed: false, character: cancelledChar } });
            }
            if (profile.adventure.start === null) {
                // Start adventure
                await users.updateOne({ id }, { $set: { adventure: { type, start: data.start, character: char.name } } });
                res.status(200).json({ status: 200, message: "Adventure started", data: { status: false, completed: false, character: char.name } });
            } else {
                const timeElasped = data.start.getTime() - profile.adventure.start.getTime();
                data = { type: profile.adventure.type, start: profile.adventure.start };
                if (timeElasped > THRESHOLD) {
                    let reward, user, _, result;
                    switch (profile.adventure.type) {
                    case "commission":
                        user = (await users.findOneAndUpdate({ id }, { $set: { adventure: { type: null, start: null, character: char.name } }, $inc: { coins: REWARD * char.level } })).value;
                        if (user === null) return res.status(500);
                        reward = { coins: user.coins, reward: REWARD * char.level };
                        break;
                    case "domain":
                        const artifact = utils.generateArtifact();
                        [_, result] = await Promise.all([
                            client.db(id).collection<Artifact>("artifacts").insertOne(artifact),
                            users.findOneAndUpdate({ id }, { $set: { adventure: { type: null, start: null, character: char.name } } }),
                        ]);
                        user = result.value;
                        if (user === null) return res.status(500);
                        const mainStat = utils.getMainStatValue(artifact);
                        const artifactInfo = { ...artifact, value: mainStat };
                        reward = { artifact: artifactInfo };
                        break;
                    case "expedition":
                        [_, result] = await Promise.all([
                            char.level < 90 && await client.db(id).collection<Character>("characters").findOneAndUpdate({ name: character }, { $inc: { level: 1 } }),
                            users.findOneAndUpdate({ id }, { $set: { adventure: { type: null, start: null, character: char.name } } }),
                        ]);
                        user = result.value;
                        if (user === null) return res.status(500);
                        reward = { old_level: char.level, level_gained: 1 };
                    }
                    res.status(200).json({ status: 200, message: "Adventure completed", data: { status: true, completed: true, reward } });
                } else {
                    res.status(200).json({ status: 200, message: "Adventure ongoing", data: { status: true, completed: false, timeElasped, timeRequired: THRESHOLD } });
                }
            }
        } 
    } else if (req.method === "GET") {
        const id = req.query.id as string;
        const { client } = await connectToDB();
        const userExists = await verifyDb(id);

        if (userExists) {
            const users = client.db("db").collection<UserProfile>("users");
            const profile = await users.findOne({ id });
            if (profile === null) return res.status(500).json({ status: 500, message: "Interval server error" });

            if (profile.adventure.start === null) {
                // No ongoing adventure
                res.status(200).json({ status: 200, message: "Currently not on an adventure", data: { status: false, completed: false } });
            } else {
                // Adventure in progress
                const timeElasped = new Date().getTime() - profile.adventure.start.getTime();
                if (timeElasped > THRESHOLD) {
                    res.status(200).json({ status: 200, message: "Adventure completed", data: { status: true, completed: true, ...profile.adventure } });
                } else {
                    res.status(200).json({ status: 200, message: "Adventure ongoing", data: { status: true, completed: false, ...profile.adventure } });
                }
            }
        }
    } else {
        res.status(405).json({ status: 405, message: "Method not allowed" });
    }
    return res.end();
}
