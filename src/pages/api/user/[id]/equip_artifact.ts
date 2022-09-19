import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../../util";

interface ResponseData {
    status: number
    message: string
    data?: Response
}

type Response = Character | null

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "POST") {
        if(utils.validateToken(req, res) === false) return;
        const id = req.query.id as string;
        const { character, artifactId } = req.body as {[key: string]: string};
        const artifact = new ObjectId(artifactId);

        const { client } = await utils.connectToDB();
        const userExists = await utils.verifyDb(id);

        if (!userExists) return res.status(404).json({ status: 404, message: "User does not exist" });

        const charCol = client.db(id).collection<Character>("characters");
        const artiCol = client.db(id).collection<Artifact>("artifacts");
        const [char, arti] = await Promise.all([
            charCol.findOne({ name: character }),
            artiCol.findOne({ _id: artifact }),
        ]);
        if (char === null) return res.status(404).json({ status: 404, message: "Character not found" });
        if (arti === null) return res.status(404).json({ status: 404, message: "Artifact not found" });
        if (artifact.equals(char[arti.type] ?? "")) return res.status(400).json({ status: 400, message: "Character is already equipping that artifact" });

        const updatedArtifact = {} as {[key: string]: ObjectId};
        const equippedArtifact = {} as {[key: string]: null};
        updatedArtifact[arti.type] = artifact;
        equippedArtifact[arti.type] = null;

        await Promise.all([
            charCol.updateOne(updatedArtifact, { $set: equippedArtifact }),
            artiCol.updateOne({ equipped: character, type: arti.type }, { $set: { equipped: null } }),
        ]);

        await Promise.all([
            charCol.updateOne({ name: character }, { $set: updatedArtifact }),
            artiCol.updateOne({ _id: artifact }, { $set: { equipped: character } }),
        ]);

        const newCharInfo = await charCol.findOne({ name: character });

        res.status(200).json({ status: 200, message: "Success", data: newCharInfo });
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route", data: null });
    }
    return res.end();
}
