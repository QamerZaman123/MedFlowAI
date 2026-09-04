import { embedText } from "./EmbeddingService.js";
import { getQdrantClient, QDRANT_COLLECTION } from "../Config/QdrantConfig.js";

/**
 * Searches Qdrant vector database for top matching document chunks
 * @param {string} queryText - User's clinical search or question
 * @param {number} [topK=5] - Number of top chunks to retrieve
 * @param {number} [scoreThreshold=0.65] - Minimum cosine similarity threshold (to avoid hallucinations)
 * @returns {Promise<Array<{ documentId: string, documentName: string, chunkText: string, page: number, section: string, category: string, score: number }>>}
 */
export const retrieveRelevantChunks = async (queryText, topK = 5, scoreThreshold = 0.65) => {
  try {
    if (!queryText || !queryText.trim()) {
      return [];
    }

    // Step 1: Embed query using Gemini
    const queryVector = await embedText(queryText.trim());

    // Step 2: Query Qdrant
    const qdrant = getQdrantClient();
    let searchResults = [];

    if (typeof qdrant.query === "function") {
      const queryRes = await qdrant.query(QDRANT_COLLECTION, {
        query: queryVector,
        limit: topK,
        with_payload: true,
        score_threshold: scoreThreshold,
      });
      searchResults = queryRes?.points || [];
    } else if (typeof qdrant.search === "function") {
      searchResults = await qdrant.search(QDRANT_COLLECTION, {
        vector: queryVector,
        limit: topK,
        with_payload: true,
        score_threshold: scoreThreshold,
      });
    }

    if (!searchResults || searchResults.length === 0) {
      console.log(`🔍 [Retrieval] No chunks found matching query above threshold (${scoreThreshold})`);
      return [];
    }

    const relevantChunks = searchResults.map((hit) => ({
      documentId: hit.payload?.documentId || "",
      documentName: hit.payload?.documentName || "Unknown Document",
      chunkText: hit.payload?.chunkText || "",
      page: hit.payload?.page || 1,
      section: hit.payload?.section || "General",
      category: hit.payload?.category || "Other",
      score: hit.score,
    }));

    console.log(`🎯 [Retrieval] Found ${relevantChunks.length} relevant chunks (top score: ${relevantChunks[0]?.score.toFixed(4)})`);
    return relevantChunks;
  } catch (error) {
    console.error("Error retrieving relevant chunks from Qdrant:", error.message);
    // Return empty array so caller can gracefully handle as zero-match rather than crashing
    return [];
  }
};

export default {
  retrieveRelevantChunks,
};
