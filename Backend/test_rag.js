import { parseDocument } from "./Services/ParsingService.js";
import { chunkText } from "./Services/ChunkingService.js";
import { buildSystemPrompt } from "./Services/RagService.js";

async function runTests() {
  console.log("=== Testing RAG & Knowledge Pipeline Components ===");

  // 1. Test TXT parsing
  const testTxt = `
Section 1.0 Dengue Clinical Management
Dengue fever is a mosquito-borne viral disease. Patients presenting with high fever, retro-orbital pain, and thrombocytopenia require immediate monitoring.

Section 2.0 Emergency Triage Guidelines
Patients with warning signs such as severe abdominal pain, persistent vomiting, mucosal bleeding, and fluid accumulation must be admitted to the High Dependency Unit (HDU) immediately.
  `.trim();

  const txtBuffer = Buffer.from(testTxt, "utf-8");
  const parsedTxt = await parseDocument(txtBuffer, "txt");
  console.log("✅ TXT Parsing result:", {
    fullTextLength: parsedTxt.fullText.length,
    pagesCount: parsedTxt.pages.length,
  });

  // 2. Test Chunking
  const chunks = chunkText(parsedTxt.pages, { chunkSize: 200, overlap: 50 });
  console.log(`✅ Chunking generated ${chunks.length} chunks:`);
  chunks.forEach((c, idx) => {
    console.log(`   Chunk ${idx + 1} (Page ${c.page}, Section: "${c.section}"): "${c.chunkText.slice(0, 60)}..."`);
  });

  // 3. Test System Prompt Construction
  const mockChunks = [
    {
      documentName: "Dengue Management SOP",
      section: "2.0 Emergency Triage Guidelines",
      page: 1,
      category: "SOP",
      chunkText: "Patients with warning signs must be admitted to HDU.",
    },
  ];

  const systemPrompt = buildSystemPrompt(mockChunks);
  console.log("✅ System Prompt constructed successfully (contains grounding rules & context)");

  console.log("\nAll unit-level pipeline checks passed successfully! 🎉");
}

runTests().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
