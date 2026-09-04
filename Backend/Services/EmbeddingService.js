import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { VECTOR_DIMENSION } from "../Config/QdrantConfig.js";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const embeddingModelName = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    if (!geminiApiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not set. Embedding calls will fail until configured.");
    }
    genAI = new GoogleGenerativeAI(geminiApiKey || "dummy_key");
  }
  return genAI;
};

/**
 * Helper to delay execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates vector embedding for a single string with retry-with-backoff
 * @param {string} text
 * @param {number} [maxRetries=3]
 * @returns {Promise<number[]>}
 */
export const embedText = async (text, maxRetries = 3) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in environment.");
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      const ai = getGenAI();
      const model = ai.getGenerativeModel({ model: embeddingModelName });

      let result;
      try {
        // Explicitly request matching vector dimension (e.g. 768 for gemini-embedding-2)
        result = await model.embedContent({
          content: { parts: [{ text }] },
          outputDimensionality: VECTOR_DIMENSION,
        });
      } catch (dimErr) {
        // Fallback for models not supporting outputDimensionality
        result = await model.embedContent(text);
      }

      let values = result?.embedding?.values;
      if (!values || values.length === 0) {
        throw new Error("Empty embedding values returned from Gemini API");
      }

      // Ensure vector length matches target dimension if returned longer
      if (values.length > VECTOR_DIMENSION) {
        values = values.slice(0, VECTOR_DIMENSION);
      }

      return values;
    } catch (error) {
      attempt++;
      lastError = error;
      console.warn(`⚠️ Embedding attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const backoffTime = 300 * Math.pow(2, attempt - 1);
        await delay(backoffTime);
      }
    }
  }

  console.error("❌ All embedding retry attempts exhausted:", lastError?.message);
  throw new Error(`Embedding generation failed after ${maxRetries} attempts: ${lastError?.message}`);
};

/**
 * Generates vector embeddings for a list of texts with rate-limit friendly batching
 * @param {string[]} texts
 * @param {number} [batchSize=8]
 * @param {number} [delayMs=200]
 * @returns {Promise<Array<number[]>>}
 */
export const embedBatch = async (texts, batchSize = 8, delayMs = 200) => {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map((txt) => embedText(txt));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);

    if (i + batchSize < texts.length && delayMs > 0) {
      await delay(delayMs);
    }
  }

  return embeddings;
};

export default {
  embedText,
  embedBatch,
};
