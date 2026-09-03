import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;
export const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || "clinic_knowledge_base";

// Embedding dimension for Google Gemini text-embedding-004 is 768
export const VECTOR_DIMENSION = 768;

let client = null;

export const getQdrantClient = () => {
  if (!client) {
    if (!qdrantUrl) {
      console.warn("⚠️ QDRANT_URL is not set. Qdrant operations will fail until configured.");
    }
    client = new QdrantClient({
      url: qdrantUrl || "http://localhost:6333",
      apiKey: qdrantApiKey || undefined,
      checkCompatibility: false,
    });
  }
  return client;
};

export const ensureCollectionExists = async () => {
  try {
    const qdrant = getQdrantClient();
    if (!process.env.QDRANT_URL) {
      console.warn("⚠️ Skipping Qdrant collection check: QDRANT_URL is not configured.");
      return false;
    }

    const { collections } = await qdrant.getCollections();
    const exists = collections.some((c) => c.name === QDRANT_COLLECTION);

    if (!exists) {
      console.log(`Creating Qdrant collection '${QDRANT_COLLECTION}' (dim: ${VECTOR_DIMENSION}, distance: Cosine)...`);
      await qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: "Cosine",
        },
      });
      console.log(`✅ Qdrant collection '${QDRANT_COLLECTION}' created successfully.`);
    } else {
      console.log(`✅ Qdrant collection '${QDRANT_COLLECTION}' already exists.`);
    }
    return true;
  } catch (error) {
    console.error("❌ Failed to ensure Qdrant collection:", error.message);
    return false;
  }
};

export default getQdrantClient;
