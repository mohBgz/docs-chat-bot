// qdrantClient.ts
import 'dotenv/config'; // ✅ Loads .env automatically
import { QdrantClient } from "@qdrant/js-client-rest";

// Read environment variables
const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API;

// Safety check
if (!qdrantUrl) throw new Error("QDRANT_URL is not defined in .env");
if (!qdrantApiKey) throw new Error("QDRANT_API is not defined in .env");

// Create and export Qdrant client
const clientQdrant = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});

export default clientQdrant;
