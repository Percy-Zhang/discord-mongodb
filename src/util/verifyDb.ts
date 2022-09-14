import { MongoClient } from "mongodb";

export async function verifyDb(client: MongoClient, name: string) {
    const dbs = await client.db().admin().listDatabases();
    const list = dbs.databases.filter((db) => db.name === name);
    return list.length > 0;
}
