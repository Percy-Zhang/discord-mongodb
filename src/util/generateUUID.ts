import { connectToDB } from "./mongodb";

interface documentUUID {
    _id: string
    value: number
    type: "uuid"
}

export async function generateUUID() {
    const { client } = await connectToDB();
    const collection = client.db("db").collection<documentUUID>("uuid");
    const uuid = await collection.findOneAndUpdate({ type: "uuid" }, { $inc: { value: 1 } } );
    if (uuid.value === null) {
        return Math.floor(Math.random() * 10000000);
    } else {
        return uuid.value.value;
    }
}
