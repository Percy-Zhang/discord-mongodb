import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let cachedClient : MongoClient | null = null;

if (uri === undefined) {
    throw new Error("MONGODB_URI env is undefined");
};

export async function connectToDB() {
    if (uri === undefined) throw new Error("MONGODB_URI env is undefined");
    if (cachedClient !== null) return { client: cachedClient };

    const client = new MongoClient(uri);
    
    try {
        console.log("Attempting to establish connection");
        await client.db("main").command({ ping: 1 });
        console.log("Connected successfully to server");
    } finally {
        cachedClient = client;
        return { client };
    }
}
