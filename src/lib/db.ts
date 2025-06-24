import { MongoClient } from "mongodb";
import { LRUCache } from "lru-cache";

// LRU Cache for MongoDB connections
const cache = new LRUCache<string, MongoClient>({
  max: 10, // Maximum number of connections to cache
  ttl: 1000 * 60 * 30, // 30 minutes TTL
});

let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // Check if we have a cached connection
  const cached = cache.get(uri);
  if (cached) {
    return cached;
  }

  // If we have a global cached client, use it
  if (cachedClient) {
    cache.set(uri, cachedClient);
    return cachedClient;
  }

  // Create new connection
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Cache the connection
    cache.set(uri, client);
    cachedClient = client;

    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db();
}

export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (cachedClient) {
    await cachedClient.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});
