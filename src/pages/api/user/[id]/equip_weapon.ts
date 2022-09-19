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
        const { character, weaponId } = req.body as {[key: string]: string};
        const weapon = parseInt(weaponId);

        const { client } = await utils.connectToDB();
        const userExists = await utils.verifyDb(id);

        if (!userExists) return res.status(404).json({ status: 404, message: "User does not exist" });

        const charCol = client.db(id).collection<Character>("characters");
        const weapCol = client.db(id).collection<Weapon>("weapons");
        const [char, weap] = await Promise.all([
            charCol.findOne({ name: character }),
            weapCol.findOne({ id: weapon }),
        ]);
        if (char === null) return res.status(404).json({ status: 404, message: "Character not found" });
        if (weap === null) return res.status(404).json({ status: 404, message: "Weapon not found" });
        if (char.weapon === weap.id) return res.status(400).json({ status: 400, message: "Character is already equipping that weapon" });
        if (char.type !== weap.type) return res.status(400).json({ status: 400, message: "Character cannot equip that weapon type" });

        await Promise.all([
            charCol.updateOne({ weapon }, { $set: { weapon: null } }),
            weapCol.updateOne({ equipped: character }, { $set: { equipped: null } }),
        ]);

        await Promise.all([
            charCol.updateOne({ name: character }, { $set: { weapon } }),
            weapCol.updateOne({ id: weapon }, { $set: { equipped: character } }),
        ]);

        const newCharInfo = await charCol.findOne({ name: character });

        res.status(200).json({ status: 200, message: "Success", data: newCharInfo });
    } else {
        res.status(405).json({ status: 405, message: "Incorrect route", data: null });
    }
    return res.end();
}
