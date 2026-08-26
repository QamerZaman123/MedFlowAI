import { v4 as uuidv4 } from "uuid";
import { parseDocument } from "./ParsingService.js";
import { chunkText } from "./ChunkingService.js";
import { embedBatch } from "./EmbeddingService.js";
import { getQdrantClient, QDRANT_COLLECTION } from "../Config/QdrantConfig.js";
import Document from "../Models/Document.js";

/**
 * End-to-end ingestion pipeline: Parse -> Chunk -> Embed -> Qdrant Upsert -> Update MongoDB status
 * @param {Buffer} fileBuffer - Raw file binary
 * @param {string} fileType - Extension / type ('pdf', 'docx', 'txt')
 * @param {Object} documentMeta - Metadata object
 * @param {string} documentMeta.documentId - MongoDB Document._id string
 * @param {string} documentMeta.documentName - User-friendly document title
 * @param {string} [documentMeta.category] - Document category
 */
export const ingestDocument = async (fileBuffer, fileType, documentMeta) => {
  const { documentId, documentName, category } = documentMeta;

  try {
    console.log(`🚀 [Ingestion] Starting ingestion for document: ${documentName} (${documentId})`);

    // Step 1: Parse Document
    const { pages, fullText } = await parseDocument(fileBuffer, fileType);
    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No readable text found in document (failed standard parsing and OCR)");
    }
    console.log(`📄 [Ingestion] Parsed ${pages.length} page(s), total characters: ${fullText.length}`);

    // Step 2: Semantic Chunking
    const chunks = chunkText(pages, { chunkSize: 800, overlap: 150 });
    if (!chunks || chunks.length === 0) {
      throw new Error("Document chunking produced 0 chunks");
    }
    console.log(`🧩 [Ingestion] Generated ${chunks.length} chunks`);

    // Step 3: Generate Embeddings
    const chunkTexts = chunks.map((c) => c.chunkText);
    console.log(`🧠 [Ingestion] Generating embeddings for ${chunks.length} chunks via Gemini...`);
    const embeddings = await embedBatch(chunkTexts, 10, 100);

    // Step 4: Prepare Qdrant Points & Upsert
    const points = chunks.map((chunk, idx) => ({
      id: uuidv4(),
      vector: embeddings[idx],
      payload: {
        documentId: String(documentId),
        documentName: documentName || "Untitled",
        chunkText: chunk.chunkText,
        page: chunk.page || 1,
        section: chunk.section || "General",
        category: category || "Other",
      },
    }));

    console.log(`💾 [Ingestion] Upserting ${points.length} points to Qdrant collection '${QDRANT_COLLECTION}'...`);
    const qdrant = getQdrantClient();
    await qdrant.upsert(QDRANT_COLLECTION, {
      wait: true,
      points,
    });

    // Step 5: Update Document status in MongoDB
    await Document.findByIdAndUpdate(documentId, {
      status: "indexed",
      chunkCount: chunks.length,
      errorMessage: "",
    });

    console.log(`✅ [Ingestion] Successfully indexed document: ${documentName} (${chunks.length} chunks)`);
    return { success: true, chunkCount: chunks.length };
  } catch (error) {
    console.error(`❌ [Ingestion] Ingestion failed for document ${documentId}:`, error.message);

    try {
      await Document.findByIdAndUpdate(documentId, {
        status: "failed",
        errorMessage: error.message || "Ingestion pipeline failure",
      });
    } catch (dbErr) {
      console.error("Failed to update document status to failed in DB:", dbErr.message);
    }

    throw error;
  }
};

export default {
  ingestDocument,
};
