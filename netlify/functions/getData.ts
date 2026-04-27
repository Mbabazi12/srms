const { MongoClient } = require("mongodb");

const uri = process.env.DATABASE_URL;

exports.handler = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("srms");

    const data = await db.collection("srms").find().toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await client.close();
  }
};