import { MongoClient } from "mongodb";
import { connectToDB } from "./mongodb";

export async function verifyDb(name: string) {
    const { client } = await connectToDB();
    const dbs = await client.db().admin().listDatabases();
    const list = dbs.databases.filter((db) => db.name === name);
    return list.length > 0;
}
