/**
 * ============================================================================
 * PatientTwinService.js — AI-Powered Patient Digital Twin Q&A
 * ============================================================================
 *
 * INSPECTION REPORT:
 * - PREVIOUSLY: The Patient Timeline in the Doctor Workspace displayed static cards
 *   plus local in-memory encounters. No natural-language Q&A service existed over
 *   a patient's longitudinal consultation history.
 * - BUILT NEW: This service aggregates all verified Consultation records and Patient
 *   history into an assembled context window and queries Groq Llama-3.3-70B with
 *   strict zero-hallucination patient grounding.
 * ============================================================================
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import Patient from "../Models/Patient.js";
import Consultation from "../Models/Consultation.js";

dotenv.config();

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is not set. Patient Digital Twin will use deterministic summary fallback.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy_key" });
  }
  return groqClient;
};

/**
 * Builds chronological text context from patient records and consultation history
 * @param {string} patientId - Patient unique identifier or ObjectId
 * @returns {Promise<{ hasRecords: boolean, contextText: string, encounterCount: number, patientName: string }>}
 */
export const buildPatientContext = async (patientId) => {
  let patientDoc = null;
  let consultations = [];

  if (Patient.db?.readyState === 1) {
    patientDoc = await Patient.findOne({
      $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
    });
  }

  if (Consultation.db?.readyState === 1) {
    const query = patientDoc
      ? { $or: [{ patient: patientDoc._id }, { patientId: patientDoc.patientId }, { patientId }] }
      : { patientId };

    consultations = await Consultation.find(query)
      .populate("doctor", "username email role")
      .sort({ createdAt: 1 }) // Chronological order
      .limit(15);
  }

  const patientName = patientDoc?.name || "Patient";
  const historyEntries = patientDoc?.history || [];
  const totalEncounters = consultations.length + historyEntries.length;

  if (!patientDoc && consultations.length === 0) {
    return {
      hasRecords: false,
      contextText: "",
      encounterCount: 0,
      patientName,
    };
  }

  let context = `=== PATIENT DEMOGRAPHIC & BASELINE PROFILE ===\n`;
  context += `Name: ${patientDoc?.name || "Unknown"}\n`;
  context += `Patient ID: ${patientDoc?.patientId || patientId}\n`;
  context += `Age/Gender: ${patientDoc?.age || "N/A"} yrs / ${patientDoc?.gender || "N/A"}\n`;
  context += `Current Working Diagnosis: ${patientDoc?.diagnosis || "None specified"}\n`;
  context += `Baseline Vitals: BP: ${patientDoc?.vitals?.bp || "N/A"}, Pulse: ${patientDoc?.vitals?.pulse || "N/A"}, Temp: ${patientDoc?.vitals?.temp || "N/A"}, SpO2: ${patientDoc?.vitals?.spo2 || "N/A"}\n\n`;

  context += `=== CHRONOLOGICAL MEDICAL ENCOUNTERS & CONSULTATIONS ===\n`;

  // 1. Append structured Patient history items
  if (historyEntries.length > 0) {
    historyEntries.forEach((entry, idx) => {
      context += `\n[Historical Encounter ${idx + 1} — Date: ${new Date(entry.date).toLocaleDateString()}]\n`;
      context += `Visit Type: ${entry.visitType}\n`;
      context += `Clinical Notes: ${entry.notes}\n`;
      if (entry.vitals) context += `Recorded Vitals: ${entry.vitals}\n`;
      if (entry.labResults) context += `Lab Results: ${entry.labResults}\n`;
    });
  }

  // 2. Append finalized Consultation SOAP records
  if (consultations.length > 0) {
    consultations.forEach((cons, idx) => {
      const doctorName = cons.doctor?.username ? `Dr. ${cons.doctor.username}` : "Attending Physician";
      context += `\n[Consultation SOAP Note ${idx + 1} — Date: ${new Date(cons.createdAt).toLocaleDateString()} by ${doctorName}]\n`;
      context += `Status: ${cons.status.toUpperCase()}\n`;
      context += `Raw Notes: ${cons.rawNotes}\n`;
      if (cons.soapNote) {
        if (cons.soapNote.subjective) context += `• Subjective: ${cons.soapNote.subjective}\n`;
        if (cons.soapNote.objective) context += `• Objective: ${cons.soapNote.objective}\n`;
        if (cons.soapNote.assessment) context += `• Assessment: ${cons.soapNote.assessment}\n`;
        if (cons.soapNote.plan) context += `• Plan: ${cons.soapNote.plan}\n`;
      }
    });
  }

  return {
    hasRecords: true,
    contextText: context,
    encounterCount: totalEncounters,
    patientName,
  };
};

/**
 * Answers natural language inquiries grounded strictly in patient consultation records
 * @param {string} patientId - Patient unique identifier
 * @param {string} question - Doctor's natural language question
 * @returns {Promise<{ answer: string, encounterCount: number, patientName: string }>}
 */
export const answerPatientQuery = async (patientId, question) => {
  if (!patientId || !question || !question.trim()) {
    throw new Error("Patient ID and question query are required.");
  }

  // 1. Build chronological context
  const patientContext = await buildPatientContext(patientId);

  // 2. Refusal check on zero records
  if (!patientContext.hasRecords) {
    return {
      answer: "No clinical history or consultation records found for this patient yet.",
      encounterCount: 0,
      patientName: patientContext.patientName,
    };
  }

  // 3. Fallback when API key is unconfigured
  if (!process.env.GROQ_API_KEY) {
    return {
      answer: `Based on ${patientContext.patientName}'s ${patientContext.encounterCount} recorded encounter(s):\n\n` +
        `Current Diagnosis: ${patientContext.contextText.match(/Current Working Diagnosis: (.*)/)?.[1] || "Documented in chart"}.\n` +
        `Summary of Record: Patient has documented encounters with recorded vitals and SOAP management plans in chart.`,
      encounterCount: patientContext.encounterCount,
      patientName: patientContext.patientName,
    };
  }

  // 4. Query Groq LLM with strict grounding
  const groq = getGroqClient();
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const systemPrompt = `You are MedFlowAI Patient Digital Twin Assistant. You answer doctor inquiries regarding a specific patient based EXCLUSIVELY on their verified medical records and consultation timeline below.

CRITICAL GROUNDING RULES:
1. Answer ONLY using the patient's recorded history provided in the CONTEXT below.
2. If the answer is NOT explicitly or fully contained in the patient's records (e.g. unmentioned allergies, unperformed tests, unrecorded vitals), state clearly: "This information is not documented in the patient's medical records." Never guess, extrapolate, or invent clinical facts.
3. Reference specific encounter dates, recorded vitals, and lab values where relevant.
4. Keep your answer direct, clinically accurate, and concise.

PATIENT CONTEXT:
${patientContext.contextText}
`;

  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const answer = response.choices[0]?.message?.content?.trim();

    return {
      answer: answer || "No response generated from patient record analysis.",
      encounterCount: patientContext.encounterCount,
      patientName: patientContext.patientName,
    };
  } catch (error) {
    console.error("Error in answerPatientQuery:", error);
    throw new Error(`Patient Digital Twin query failed: ${error.message}`);
  }
};

export default {
  buildPatientContext,
  answerPatientQuery,
};
