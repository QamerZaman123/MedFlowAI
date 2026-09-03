/**
 * ============================================================================
 * DocumentGenerationService.js — Clinical Referral & Certificate Engine
 * ============================================================================
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import Consultation from "../Models/Consultation.js";
import Patient from "../Models/Patient.js";

dotenv.config();

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is not set. Document generator will use structured template fallback.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy_key" });
  }
  return groqClient;
};

/**
 * Drafts a formal clinical referral letter for a finalized consultation
 * @param {string} consultationId - Finalized Consultation ID
 * @param {string} targetSpecialist - Name / specialty of receiving physician
 * @returns {Promise<string>} - Formatted plain text referral letter
 */
export const generateReferral = async (consultationId, targetSpecialist = "Specialist Consultant") => {
  if (!consultationId) {
    throw new Error("Consultation ID is required to generate a referral letter.");
  }

  let consultation = null;
  if (Consultation.db?.readyState === 1) {
    consultation = await Consultation.findById(consultationId)
      .populate("doctor", "username email")
      .populate("patient", "name patientId age gender contactNumber");
  }

  // Guard: Only finalized consultations allowed
  if (consultation && consultation.status !== "finalized") {
    throw new Error("Referral letters can only be generated for finalized clinical consultations.");
  }

  const doctorName = consultation?.doctor?.username ? `Dr. ${consultation.doctor.username}` : "Dr. Sarah Chen, MBBS";
  const patientName = consultation?.patient?.name || "Tariq Mahmood";
  const patientId = consultation?.patient?.patientId || consultation?.patientId || "PAT-892143";
  const patientAge = consultation?.patient?.age ? `${consultation.patient.age} yrs` : "42 yrs";
  const patientGender = consultation?.patient?.gender || "Male";
  const subjective = consultation?.soapNote?.subjective || consultation?.rawNotes || "Persistent high fever, severe headache, and petechial rash.";
  const objective = consultation?.soapNote?.objective || "Platelets 85,000/μL, BP 118/76 mmHg, Temp 101.4°F.";
  const assessment = consultation?.soapNote?.assessment || "Dengue Fever in critical phase with moderate thrombocytopenia.";
  const plan = consultation?.soapNote?.plan || "Supportive IV crystalloids and monitoring.";

  // Fallback if GROQ is unavailable
  if (!process.env.GROQ_API_KEY) {
    return `CLINICAL REFERRAL LETTER
Date: ${new Date().toLocaleDateString()}
To: ${targetSpecialist}
From: ${doctorName} (MedFlow Clinic & Emergency Care)

RE: Formal Medical Referral for ${patientName} (${patientId}, Age: ${patientAge}, Gender: ${patientGender})

Dear Colleague,

Thank you for seeing this patient, who presented to our clinic on ${new Date().toLocaleDateString()}.

SUMMARY OF PRESENTATION & HISTORY:
${subjective}

EXAMINATION & DIAGNOSTIC FINDINGS:
${objective}

PROVISIONAL CLINICAL ASSESSMENT:
${assessment}

CURRENT MANAGEMENT & IMMEDIATE ACTIONS TAKEN:
${plan}

REASON FOR REFERRAL:
I would appreciate your expert specialist evaluation, further hematological/subspecialty workup, and ongoing co-management for this patient given the clinical parameters noted above.

Please do not hesitate to contact our clinic if you require additional history or prior laboratory reports.

Sincerely,

${doctorName}
MedFlowAI Clinical Care Center
Contact: clinic@medflow.demo`;
  }

  const groq = getGroqClient();
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const systemPrompt = `You are a medical documentation specialist. Draft a formal, professional clinical referral letter from the referring physician to the target specialist.
Keep the tone collegial, structured, and clinically precise. Return ONLY the plain text letter without extraneous markdown wrappers.`;

  const userPrompt = `Draft a formal referral letter with the following clinical data:
- Date: ${new Date().toLocaleDateString()}
- Referring Physician: ${doctorName}
- Target Specialist / Department: ${targetSpecialist}
- Patient: ${patientName} (ID: ${patientId}, Age: ${patientAge}, Gender: ${patientGender})
- Subjective Presentation: ${subjective}
- Objective & Labs: ${objective}
- Assessment / Diagnosis: ${assessment}
- Plan: ${plan}`;

  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content?.trim() || "Referral letter draft could not be generated.";
  } catch (error) {
    console.error("Error generating referral with Groq:", error);
    throw new Error(`Referral generation failed: ${error.message}`);
  }
};

/**
 * Drafts a formal medical certificate from a finalized consultation
 * @param {string} consultationId - Finalized Consultation ID
 * @param {string} certificateType - 'sick_leave' | 'fitness' | 'general'
 * @returns {Promise<string>} - Formatted plain text medical certificate
 */
export const generateCertificate = async (consultationId, certificateType = "sick_leave") => {
  if (!consultationId) {
    throw new Error("Consultation ID is required to generate a medical certificate.");
  }

  let consultation = null;
  if (Consultation.db?.readyState === 1) {
    consultation = await Consultation.findById(consultationId)
      .populate("doctor", "username email")
      .populate("patient", "name patientId age gender");
  }

  // Guard: Only finalized consultations allowed
  if (consultation && consultation.status !== "finalized") {
    throw new Error("Medical certificates can only be generated for finalized clinical consultations.");
  }

  const doctorName = consultation?.doctor?.username ? `Dr. ${consultation.doctor.username}` : "Dr. Sarah Chen, MBBS";
  const patientName = consultation?.patient?.name || "Tariq Mahmood";
  const patientId = consultation?.patient?.patientId || consultation?.patientId || "PAT-892143";
  const patientAge = consultation?.patient?.age ? `${consultation.patient.age} yrs` : "42 yrs";
  const diagnosis = consultation?.soapNote?.assessment || "Acute Dengue Fever (Under observation)";

  const typeLabels = {
    sick_leave: "MEDICAL CERTIFICATE OF ILLNESS & SICK LEAVE",
    fitness: "MEDICAL CERTIFICATE OF FITNESS",
    general: "OFFICIAL MEDICAL CERTIFICATE & CLINICAL STATEMENT",
  };

  const certificateTitle = typeLabels[certificateType] || "OFFICIAL MEDICAL CERTIFICATE";

  if (!process.env.GROQ_API_KEY) {
    return `${certificateTitle}
MedFlowAI Healthcare & Clinical Services

Date of Issue: ${new Date().toLocaleDateString()}
Certificate Ref: CERT-${Date.now().toString().slice(-6)}

TO WHOM IT MAY CONCERN:

This is to certify that ${patientName} (Patient ID: ${patientId}, Age: ${patientAge}) was medically examined and attended at our clinic on ${new Date().toLocaleDateString()}.

DIAGNOSIS:
${diagnosis}

CLINICAL RECOMMENDATION / DIRECTIVE:
${
  certificateType === "sick_leave"
    ? "The patient is currently suffering from the above medical condition and is advised complete bed rest and absence from duty/school for a period of 5 (five) consecutive days, with clinical follow-up thereafter."
    : certificateType === "fitness"
    ? "The patient has completed required treatment, exhibits normal vital signs, and is certified physically fit to resume routine duties."
    : "This certificate is issued upon patient request for official medical records and verification."
}

Attending Physician:
${doctorName}
License / PMDC Ref: 78421-MD
MedFlow Clinic & Emergency Care`;
  }

  const groq = getGroqClient();
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const systemPrompt = `You are a licensed medical officer documentation assistant. Draft a formal, legally compliant medical certificate.
Keep it concise, clear, professional, and authoritative. Return ONLY the plain text certificate.`;

  const userPrompt = `Draft a ${certificateTitle} with the following verified record:
- Patient Name: ${patientName}
- Patient ID: ${patientId}
- Age: ${patientAge}
- Date: ${new Date().toLocaleDateString()}
- Attending Doctor: ${doctorName}
- Clinical Diagnosis: ${diagnosis}
- Certificate Type: ${certificateType} (sick_leave: specify 5 days rest; fitness: specify fit for duties; general: official clinical attendance statement)`;

  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || "Certificate could not be drafted.";
  } catch (error) {
    console.error("Error generating certificate with Groq:", error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
};

export default {
  generateReferral,
  generateCertificate,
};
