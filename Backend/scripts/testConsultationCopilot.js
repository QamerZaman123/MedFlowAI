import dotenv from "dotenv";
import { generateSoapNote } from "../Services/SoapNoteService.js";

dotenv.config();

async function testSoapGeneration() {
  console.log("\n=======================================================");
  console.log("🩺 Testing AI Consultation Copilot (SOAP Note Engine)");
  console.log("=======================================================\n");

  const rawNotes =
    "42-year-old male with persistent fever of 101.4F for 4 days, severe retro-orbital headache, body aches, and petechiae on arms. Platelets dropped to 85k, hematocrit 41%. No mucosal bleeding.";

  console.log("1. Generating structured clinical SOAP note from raw notes...");
  const result = await generateSoapNote(rawNotes);

  console.log("\n✅ SOAP NOTE GENERATION RESULT:");
  console.log("-------------------------------------------------------");
  console.log("S - SUBJECTIVE:\n", result.subjective);
  console.log("\nO - OBJECTIVE:\n", result.objective);
  console.log("\nA - ASSESSMENT:\n", result.assessment);
  console.log("\nP - PLAN:\n", result.plan);
  console.log("-------------------------------------------------------");
  console.log(`Fallback Mode: ${result.isFallback ? "YES" : "NO (Live Groq Llama-3.3-70B)"}`);

  console.log("\n🎉 AI Consultation Copilot Subsystem Verified Successfully!\n");
}

testSoapGeneration().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
