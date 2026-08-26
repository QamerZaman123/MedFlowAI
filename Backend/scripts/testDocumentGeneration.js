import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateReferral, generateCertificate } from "../Services/DocumentGenerationService.js";
import Consultation from "../Models/Consultation.js";
import Patient from "../Models/Patient.js";
import User from "../Models/User.js";

dotenv.config();

async function testDocumentGeneration() {
  console.log("\n=======================================================");
  console.log("📄 Testing Medical Referral & Certificate Generator");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/MyDB";
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected");

  // 1. Fetch or create a test finalized consultation
  let doctor = await User.findOne({ role: "doctor" });
  let patient = await Patient.findOne();

  let consultation = await Consultation.findOne({ status: "finalized" });
  if (!consultation && doctor && patient) {
    consultation = new Consultation({
      doctor: doctor._id,
      patient: patient._id,
      patientId: patient.patientId,
      rawNotes: "Patient has high fever, severe retro-orbital pain, platelets 85k.",
      soapNote: {
        subjective: "High fever for 4 days, severe retro-orbital headache.",
        objective: "Temp 101.4F, BP 118/76, Platelets 85,000/uL.",
        assessment: "Dengue Fever in critical phase with moderate thrombocytopenia.",
        plan: "Oral electrolyte rehydration @ 2.5ml/kg/hr, daily CBC.",
      },
      status: "finalized",
    });
    await consultation.save();
  }

  const consultationId = consultation ? consultation._id.toString() : "dummy_consultation_id";

  // 2. Test Referral Generation
  console.log("1. Generating Clinical Referral Letter...");
  const referralLetter = await generateReferral(
    consultationId,
    "Dr. Kamran - Consultant Hematologist, AKUH"
  );
  console.log("\n✅ REFERRAL LETTER OUTPUT:\n-------------------------------------------------------");
  console.log(referralLetter.slice(0, 400) + "...\n-------------------------------------------------------");

  // 3. Test Certificate Generation
  console.log("\n2. Generating Official Medical Certificate (Sick Leave)...");
  const sickCertificate = await generateCertificate(consultationId, "sick_leave");
  console.log("\n✅ MEDICAL CERTIFICATE OUTPUT:\n-------------------------------------------------------");
  console.log(sickCertificate.slice(0, 400) + "...\n-------------------------------------------------------");

  await mongoose.disconnect();
  console.log("\n🎉 Document Generation Subsystem Verified Successfully!\n");
}

testDocumentGeneration().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
