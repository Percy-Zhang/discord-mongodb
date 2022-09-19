import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "../../../../util";

interface ResponseData {
    status: number
    message: string
    data: null | Data[]
}

interface Data {
    name: string
    rarity: number
    pity: number
}

const WISH_COST = 160;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === "POST") {
        if(utils.validateToken(req, res) === false) return;
        let { id = "" } = req.query;
        const bannerId = parseInt(req.body.banner);
        const amount = parseInt(req.body.amount);
        id = Array.isArray(id) ? id[0] : id;

        if (amount < 1 || amount > 10 || isNaN(amount)) return res.status(400).json({ status: 400, message: "Amount must be between 1 and 10", data: null  });
        
        const { client } = await utils.connectToDB();
        const archive = client.db("archive");
        const users = client.db("db").collection<UserProfile>("users");

        const [userExists, banner, charArchive, weapArchive, profile] = await Promise.all([
            utils.verifyDb(id),
            utils.verifyBanner(client, bannerId),
            archive.collection<CharArchive>("characters").find().toArray(),
            archive.collection<WeapArchive>("weapons").find().toArray(),
            users.findOne({ id }),
        ]);

        const bannerExists = banner !== null;
        const data = [];
        if (userExists && bannerExists) {
            if ((profile?.coins ?? 0) < WISH_COST * amount) {
                return res.status(500).json({ status: 500, message: "Not enough coins", data: null  });
            }
            for (let i = 0; i < amount; i++) {
                if (profile !== null) {
                    const { rarity, pity } = await calcNextRarity(profile);
                    const limited = await calcNextIsGuarantee(profile, rarity);

                    const charArchiveFiltered = charArchive.filter((char) => char.rarity === rarity);
                    const weapArchiveFiltered = weapArchive.filter((weap) => weap.rarity === rarity);
                    
                    const pool = [...charArchiveFiltered, ...weapArchiveFiltered].filter((item) => 
                        limited ? banner.data.includes(item.name) : !item.limited
                    );
                    
                    // Gets a random item from pool
                    const prize = pool[Math.floor(Math.random() * pool.length)];
                    if (prize === undefined) {
                        return res.status(500).json({ status: 500, message: "No suitable candidate", data: null  });
                    }

                    if ("sex" in prize && "height" in prize) 
                        await addCharacterFromWish(id, prize);
                    else 
                        await addWeaponFromWish(id, prize);
                    
                    saveToWishHistory(id, prize, bannerId, pity);
                    data.push({ name: prize.name, rarity: prize.rarity, pity });
                }
            }
            await users.updateOne({ id }, { $inc: { coins: -(WISH_COST * amount) } });
        }

        if (!userExists) {
            res.status(404).json({ status: 404, message: "User does not exist", data: null  });
        } else if (!bannerExists) {
            res.status(404).json({ status: 404, message: "Banner does not exist", data: null });
        } else {
            res.status(200).json({ status: 200, message: "Success", data });
        }
    } else {
        res.status(405).json({ status: 405, message: "Method not allowed", data: null });
    }
    return res.end();
}

const calcNextRarity = async (profile: UserProfile) => {
    const { client } = await utils.connectToDB();
    const users = client.db("db").collection<UserProfile>("users");

    let rarity = 3;
    let obtainedPity = 1;
    const pity = profile.pity;

    // Increment and check pity first
    pity.four++;
    pity.five++;
    if (pity.four >= 10) rarity = 4;
    if (pity.five >= 90) rarity = 5;

    const odds = Math.random() * 100;
    const fiveThreshold = 0.6 + Math.max(0, (pity.five - 74) * (6.24625 + 0.0001));
    const fourThreshold = 5.1 + Math.max(0, (pity.four - 8) * 47.45) + fiveThreshold;

    if (odds < fiveThreshold) rarity = 5;
    else if (odds < fourThreshold) rarity = 4;
  
    // reset pity where appropriate
    if (rarity == 4) {
        obtainedPity = pity.four - 1;
        pity.four = 1;
    } else if (rarity == 5) {
        obtainedPity = pity.five - 1;
        pity.five = 1;
    }
    users.updateOne({ _id: profile._id }, { $set: { pity } });

    return { rarity, pity: obtainedPity };
};

const calcNextIsGuarantee = async (profile: UserProfile, rarity : number) => {
    const { client } = await utils.connectToDB();
    const users = client.db("db").collection<UserProfile>("users");

    let isRateUp = false;

    if (rarity == 5) {
        isRateUp = profile.guarantee.five;
        users.updateOne({ _id: profile._id }, { $set: { "guarantee.five": !profile.guarantee.five } });
    } else if (rarity == 4) {
        isRateUp = profile.guarantee.four;
        users.updateOne({ _id: profile._id }, { $set: { "guarantee.four": !profile.guarantee.four } });
    }

    if (isRateUp === false && rarity !== 3 && Math.random() > 0.5) {
        isRateUp = true;
    }
  
    return isRateUp;
};

const addCharacterFromWish = async (id: string, newChar: CharArchive) => {
    const { client } = await utils.connectToDB();
    const charCollection = client.db(id).collection<Character>("characters");
    const existingChar = await charCollection.findOne({ name: newChar.name });
    if (existingChar === null) {
        await charCollection.insertOne({
            _id: new ObjectId(),
            name: newChar.name,
            level: 1,
            weapon: null,
            flower: null,
            feather: null,
            sands: null,
            goblet: null,
            circlet: null,
            constellations: 0,
            talent1: 1,
            talent2: 1,
            talent3: 1,
            rarity: newChar.rarity,
            type: newChar.type,
        });
    } else if (existingChar.constellations < 6) {
        await charCollection.updateOne({ name: newChar.name }, { $inc: { constellations: 1 } } );
    }
};

const addWeaponFromWish = async (id: string, newWeap: WeapArchive) => {
    const { client } = await utils.connectToDB();
    const uuid = await utils.generateUUID();
    const weapCollection = client.db(id).collection<Weapon>("weapons");
    await weapCollection.insertOne({
        _id: new ObjectId(),
        id: uuid,
        level: 1,
        refinement: 1,
        equipped: null,
        name: newWeap.name,
        rarity: newWeap.rarity,
        type: newWeap.type,
    });
};

const saveToWishHistory = async (id: string, prize: CharArchive | WeapArchive, banner: number, pity: number, ) => {
    const { client } = await utils.connectToDB();
    const uuid = await utils.generateUUID();
    await client.db(id).collection("wishHistory").insertOne({
        banner,
        name: prize.name,
        rarity: prize.rarity,
        pity,
        timestamp: uuid,
    });
};
