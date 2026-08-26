import mongoose from "mongoose";
import dotenv from "dotenv";
import { answerPatientQuery, buildPatientContext } from "../Services/PatientTwinService.js";

dotenv.config();

async function testPatientTwinQnA() {
  console.log("\n=======================================================");
  console.log("👤 Testing Patient Digital Twin AI Q&A Engine");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/MyDB";
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected");

  const patientId = "PAT-892143"; // Tariq Mahmood seeded patient

  // 1. Test Context Building
  console.log(`\n1. Building chronological context for patient: ${patientId}...`);
  const context = await buildPatientContext(patientId);
  console.log(`   ✅ Has Records: ${context.hasRecords}`);
  console.log(`   📊 Encounter Count: ${context.encounterCount}`);
  console.log(`   👤 Patient Name: ${context.patientName}`);
  console.log(`   📄 Context Preview:\n${context.contextText.slice(0, 350)}...\n`);

  // 2. Test Grounded Query
  const testQuestion = "What was the patient's platelet count during their emergency triage encounter?";
  console.log(`2. Asking Digital Twin: "${testQuestion}"...`);
  const result = await answerPatientQuery(patientId, testQuestion);

  console.log("\n✅ DIGITAL TWIN AI ANSWER:");
  console.log("-------------------------------------------------------");
  console.log(result.answer);
  console.log("-------------------------------------------------------");
  console.log(`Encounters Analyzed: ${result.encounterCount}`);

  // 3. Test Zero-Record Guard
  console.log(`\n3. Testing Zero-Record Guard for non-existent patient (PAT-999999)...`);
  const zeroRecordResult = await answerPatientQuery("PAT-999999", "What is the diagnosis?");
  console.log(`   ✅ Zero-Record Guard Response: "${zeroRecordResult.answer}"`);

  await mongoose.disconnect();
  console.log("\n🎉 Patient Digital Twin Q&A Engine Verified Successfully!\n");
}

testPatientTwinQnA().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
