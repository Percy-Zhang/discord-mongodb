import { MongoClient } from "mongodb";

export async function getBanner(client: MongoClient, banner: number) {
    const doc = await client.db("archive").collection<Banner>("limited").findOne({ banner });
    return doc;
}
