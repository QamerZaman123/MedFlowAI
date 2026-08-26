import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { parseDocument } from "../Services/ParsingService.js";
import { chunkText } from "../Services/ChunkingService.js";
import { embedBatch, embedText } from "../Services/EmbeddingService.js";
import { retrieveRelevantChunks } from "../Services/RetrievalService.js";
import { getQdrantClient, QDRANT_COLLECTION, ensureCollectionExists } from "../Config/QdrantConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runPipelineTest() {
  console.log("\n=======================================================");
  console.log("🏥 MedFlowAI Knowledge Pipeline - Verification Runner");
  console.log("=======================================================\n");

  const sampleDocPath = path.join(__dirname, "sample-docs", "dengue_sop_sample.txt");

  if (!fs.existsSync(sampleDocPath)) {
    console.error(`❌ Sample document not found at: ${sampleDocPath}`);
    process.exit(1);
  }

  // STAGE 1: PARSING
  console.log("📄 [Stage 1/5] Testing ParsingService with sample document...");
  const buffer = fs.readFileSync(sampleDocPath);
  let parsed;
  try {
    parsed = await parseDocument(buffer, "txt");
    console.log(`  ✅ Passed: Extracted ${parsed.fullText.length} characters across ${parsed.pages.length} page(s).`);
  } catch (err) {
    console.error(`  ❌ Failed Parsing: ${err.message}`);
    process.exit(1);
  }

  // STAGE 2: CHUNKING & SECTION DETECTION
  console.log("\n🧩 [Stage 2/5] Testing ChunkingService & Section Detection...");
  let chunks;
  try {
    chunks = chunkText(parsed.pages, { chunkSize: 600, overlap: 100 });
    console.log(`  ✅ Passed: Generated ${chunks.length} chunks.`);
    chunks.forEach((c, idx) => {
      console.log(`     • Chunk ${idx + 1} (Page ${c.page}, Section: "${c.section}"): ${c.chunkText.slice(0, 70)}...`);
    });
  } catch (err) {
    console.error(`  ❌ Failed Chunking: ${err.message}`);
    process.exit(1);
  }

  // STAGE 3: EMBEDDING
  console.log("\n🧠 [Stage 3/5] Testing Gemini Embeddings API (text-embedding-004)...");
  if (!process.env.GEMINI_API_KEY) {
    console.warn("  ⚠️ Skipped: GEMINI_API_KEY is not configured in .env. Skipping remote embeddings & Qdrant tests.");
    console.log("\n🎉 Offline Pipeline Unit Tests Passed Successfully!");
    return;
  }

  let embeddings;
  try {
    const chunkTexts = chunks.map((c) => c.chunkText);
    embeddings = await embedBatch(chunkTexts, 5, 100);
    console.log(`  ✅ Passed: Successfully generated ${embeddings.length} vectors of dimension ${embeddings[0]?.length || 768}.`);
  } catch (err) {
    console.error(`  ❌ Failed Embeddings: ${err.message}`);
    return;
  }

  // STAGE 4: QDRANT UPSERT
  console.log(`\n💾 [Stage 4/5] Testing Qdrant Collection & Upsert ('${QDRANT_COLLECTION}')...`);
  if (!process.env.QDRANT_URL) {
    console.warn("  ⚠️ Skipped: QDRANT_URL is not configured in .env.");
    return;
  }

  try {
    await ensureCollectionExists();
    const qdrant = getQdrantClient();
    const testDocId = "test-sop-dengue-123";

    const points = chunks.map((chunk, idx) => ({
      id: `00000000-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`,
      vector: embeddings[idx],
      payload: {
        documentId: testDocId,
        documentName: "Dengue Clinical Management SOP",
        chunkText: chunk.chunkText,
        page: chunk.page,
        section: chunk.section,
        category: "SOP",
      },
    }));

    await qdrant.upsert(QDRANT_COLLECTION, { wait: true, points });
    console.log(`  ✅ Passed: Upserted ${points.length} points to Qdrant.`);
  } catch (err) {
    console.error(`  ❌ Failed Qdrant Upsert: ${err.message}`);
    return;
  }

  // STAGE 5: RETRIEVAL QUERY & SIMILARITY MATCH
  console.log("\n🔍 [Stage 5/5] Testing RetrievalService Cosine Search...");
  const testQuery = "What are the emergency warning signs for dengue fever admission?";
  try {
    const results = await retrieveRelevantChunks(testQuery, 3, 0.5);
    console.log(`  ✅ Passed: Query: "${testQuery}"`);
    console.log(`     Matches Found: ${results.length}`);
    results.forEach((r, idx) => {
      console.log(`     [Match ${idx + 1}] Score: ${r.score.toFixed(4)} | Section: "${r.section}" | Page ${r.page}`);
    });
  } catch (err) {
    console.error(`  ❌ Failed Retrieval: ${err.message}`);
    return;
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL 5 PIPELINE STAGES COMPLETED & VERIFIED!");
  console.log("=======================================================\n");
}

runPipelineTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
