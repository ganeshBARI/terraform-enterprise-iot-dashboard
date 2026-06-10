// Polyfill for AWS Lambda Node 18 runtime quirk
if (typeof crypto === 'undefined') {
    global.crypto = require('crypto');
}
const { MongoClient } = require('mongodb');

// const uri = "mongodb+srv://ganeshTerraform:zGm9msfONoKdKMEA@terraform.w6ampsx.mongodb.net/?retryWrites=true&w=majority";
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const client = new SecretsManagerClient({ region: "ap-south-1" });


let cachedClient = null;
let cachedDb = null;
let cachedSecret = null;

async function getDbUri() {
    if (cachedSecret) return cachedSecret;

    try {
        const response = await client.send(new GetSecretValueCommand({ 
            SecretId: "prod/iot/mongodb" 
        }));
        const secret = JSON.parse(response.SecretString);
        cachedSecret = secret.MONGODB_URI;
        return cachedSecret;
    } catch (err) {
        console.error("Error fetching secrets:", err);
        throw new Error("Could not retrieve DB credentials");
    }
}

// exports.handler = async (event) => {
//     const mongoUri = await getDbUri();
    
//     // Now use mongoUri to connect to your database...
//     // const client = await MongoClient.connect(mongoUri);
    
//     return {
//         statusCode: 200,
//         body: JSON.stringify({ message: "Connected securely!" })
//     };
// };

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(await getDbUri(), {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db("iot_enterprise_db");

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

exports.lambdaHandler = async (event, context) => {
    // Context property forces Lambda to return response immediately after code execution terminates
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("devices");

        const devices = await collection.find({}).toArray();
        console.log(devices);
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({
                status: "success",
                count: devices.length,
                data: devices
            })
        };
    } catch (error) {
        console.error("Database Core Error: ", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Cache-Control": "no-cache, no-store, must-revalidate", // Forces browser to fetch fresh data
                "Pragma": "no-cache"
            },
            body: JSON.stringify({
                status: "Failure",
                message: "Failed to connect or retrieve data from the persistent layer."
            })
        };
    }
};