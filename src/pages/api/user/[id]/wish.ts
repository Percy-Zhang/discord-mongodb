import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
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

        if (amount < 1 || amount > 1000 || isNaN(amount)) return res.status(400).json({ status: 400, message: "Amount must be between 1 and 1000", data: null  });
        
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

        const data = [];
        if (userExists && banner !== null) {
            if (profile === null) return res.status(500).json({ status: 500, message: "Internal server error", data: null  });
            if ((profile?.coins ?? 0) < WISH_COST * amount) return res.status(400).json({ status: 400, message: "Not enough coins", data: null  });

            const { rarities, pities } = await calcNextRarity(profile, amount);

            const limitedArr = await calcNextIsGuarantee(profile, rarities, amount);


            const charactersToAdd : CharArchive[] = [];
            const weaponsToAdd : WeapArchive[] = [];
            const wishHistoryToAdd = [];

            for (let i = 0; i < amount; i++) {
                const charArchiveFiltered = charArchive.filter((char) => char.rarity === rarities[i]);
                const weapArchiveFiltered = weapArchive.filter((weap) => weap.rarity === rarities[i]);
                
                const pool = [...charArchiveFiltered, ...weapArchiveFiltered].filter((item) => 
                    limitedArr[i] ? banner.data.includes(item.name) : !item.limited
                );
                
                // Gets a random item from pool
                const prize = pool[Math.floor(Math.random() * pool.length)];
                if (prize === undefined) {
                    return res.status(500).json({ status: 500, message: "No suitable candidate", data: null  });
                }

                wishHistoryToAdd.push(prize);
                if ("sex" in prize && "height" in prize) charactersToAdd.push(prize);
                else weaponsToAdd.push(prize); 

                data.push({ name: prize.name, rarity: prize.rarity, pity: pities[i] });
            }

            await Promise.all([
                addCharacterFromWish(id, charactersToAdd),
                addWeaponFromWish(id, weaponsToAdd),
                saveToWishHistory(id, wishHistoryToAdd, bannerId, pities),
                users.updateOne({ id }, { $inc: { coins: -(WISH_COST * amount) } }),
            ]);

        }

        if (!userExists) {
            res.status(404).json({ status: 404, message: "User does not exist", data: null  });
        } else if (banner === null) {
            res.status(404).json({ status: 404, message: "Banner does not exist", data: null });
        } else {
            res.status(200).json({ status: 200, message: "Success", data });
        }
    } else {
        res.status(405).json({ status: 405, message: "Method not allowed", data: null });
    }

    return res.end();
}

const calcNextRarity = async (profile: UserProfile, amount: number) => {
    const { client } = await utils.connectToDB();
    const users = client.db("db").collection<UserProfile>("users");

    const rarities = [];
    const pities = [];
    let rarity = 3;
    let obtainedPity = 1;
    const pity = profile.pity;

    for (let i = 0; i < amount; i++) {
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

        rarities.push(rarity);
        pities.push(obtainedPity);

        rarity = 3;
        obtainedPity = 1;
    }
    
    await users.updateOne({ _id: profile._id }, { $set: { pity } });

    return { rarities, pities };
};

const calcNextIsGuarantee = async (profile: UserProfile, rarities : number[], amount: number) => {
    const { client } = await utils.connectToDB();
    const users = client.db("db").collection<UserProfile>("users");

    const guarantee = profile.guarantee;
    const isRateUpArr = [];

    for (let i = 0; i < amount; i++) {
        let isRateUp = false;
        const rarity = rarities[i];

        // if 5 or 4 star, check if guaranteed
        // if not guaranteed, set guarantee true, and vice versa
        if (rarity == 5) {
            isRateUp = guarantee.five;
            guarantee.five = !guarantee.five;
        } else if (rarity == 4) {
            isRateUp = guarantee.four;
            guarantee.four = !guarantee.four;
        }
        
        // 50/50 mechanic
        // chance to get rate up even if you are not guaranteed
        // will reset guarantee to false
        if (isRateUp === false && rarity !== 3 && Math.random() > 0.5) {
            isRateUp = true;
            if (rarity === 5) guarantee.five = false;
            if (rarity === 4) guarantee.four = false;
        }

        isRateUpArr.push(isRateUp);
    }

    await users.updateOne({ _id: profile._id }, { $set: { guarantee } });
  
    return isRateUpArr;
};

const addCharacterFromWish = async (id: string, newChars: CharArchive[]) => {
    const { client } = await utils.connectToDB();
    const charCollection = client.db(id).collection<Character>("characters");

    const names : string[] = [];
    const constellations : { [key: string]: number } = {};
    for (let newChar of newChars) {
        if (!names.includes(newChar.name)) {
            names.push(newChar.name);
            constellations[newChar.name] = 1;
        } else {
            constellations[newChar.name]++;
        }
    }

    const existingChars = await charCollection.find({ name: { $in: names } }).toArray();
    const promises = [];
    
    for (let name of names) {
        const existingChar = existingChars.find((char) => char.name === name);
        if (existingChar === undefined) {
            const character = newChars.find((char) => char.name === name);
            if (character === undefined) return false;
            promises.push(charCollection.insertOne({
                _id: new ObjectId(),
                name: character.name,
                level: 1,
                weapon: null,
                flower: null,
                feather: null,
                sands: null,
                goblet: null,
                circlet: null,
                constellations: Math.min(constellations[name], 6),
                talent1: 1,
                talent2: 1,
                talent3: 1,
                rarity: character.rarity,
                type: character.type,
            }));
        } else {
            if (existingChar.constellations === 6) continue;
            const newConstellation = Math.min(existingChar.constellations + constellations[name], 6);
            promises.push(charCollection.updateOne({ name: existingChar.name }, { $set: { constellations: newConstellation } } ));
        }
    }
    
    try {
        await Promise.all(promises);
        return true;
    } catch (e) {
        return false;
    }
};

const addWeaponFromWish = async (id: string, newWeaps: WeapArchive[]) => {
    const { client } = await utils.connectToDB();
    const weapCollection = client.db(id).collection<Weapon>("weapons");

    const toInsert = [];
    for (let i in newWeaps) {
        const newWeap = newWeaps[i];
        toInsert.push({
            _id: new ObjectId(),
            level: 1,
            refinement: 1,
            equipped: null,
            name: newWeap.name,
            rarity: newWeap.rarity,
            type: newWeap.type,
        });
    }

    try {
        await weapCollection.insertMany(toInsert);
        return true;
    } catch (e) {
        return false;
    }
};

const saveToWishHistory = async (id: string, prizes: (CharArchive | WeapArchive)[], banner: number, pities: number[]) => {
    const { client } = await utils.connectToDB();

    const toInsert : WishHistory[] = [];
    for (let i in prizes) {
        toInsert.push({
            _id: new ObjectId(),
            banner,
            name: prizes[i].name,
            rarity: prizes[i].rarity,
            pity: pities[i],
            date: new Date(),
        });
    }

    await client.db(id).collection("wishHistory").insertMany(toInsert);
};
