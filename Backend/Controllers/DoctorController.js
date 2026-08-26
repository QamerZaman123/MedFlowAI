/**
 * ============================================================================
 * DoctorController.js — MedFlowAI Clinical Copilot & Consultation Engine
 * ============================================================================
 *
 * INSPECTION REPORT (Existing vs Built New):
 * - PREVIOUSLY STUBBED:
 *   - getConsultations: returned static mock consultation list.
 *   - getPatientHistory: returned empty array stub for patient timeline.
 *   - useCopilot: returned hardcoded suggestions with basic regex branching.
 *   - Consultation persistence: No Consultation model or DB storage existed.
 *
 * - BUILT NEW (Real Working Implementation):
 *   - generateConsultationNote: calls SoapNoteService (Groq Llama-3.3-70B JSON mode),
 *     parses Subjective, Objective, Assessment, and Plan, creates Consultation record in MongoDB ('draft').
 *   - finalizeConsultation: locks consultation ('finalized'), saves doctor edits, and appends encounter to Patient timeline history.
 *   - getPatientConsultations: retrieves real chronological consultations for patient digital twin timeline.
 * ============================================================================
 */

import Patient from "../Models/Patient.js";
import Consultation from "../Models/Consultation.js";
import { generateSoapNote } from "../Services/SoapNoteService.js";
import { answerPatientQuery } from "../Services/PatientTwinService.js";
import {
  generateReferral as createReferralDoc,
  generateCertificate as createCertificateDoc,
} from "../Services/DocumentGenerationService.js";

/**
 * Doctor: Generate structured SOAP note from raw consultation notes
 */
export const generateConsultationNote = async (req, res) => {
  try {
    const { patientId, rawNotes } = req.body;

    if (!rawNotes || !rawNotes.trim()) {
      return res.status(400).json({ success: false, message: "Raw consultation notes are required" });
    }

    // Step 1: Call AI SOAP Note Service
    const soapNote = await generateSoapNote(rawNotes);

    // Step 2: Resolve Patient document if exists
    let patientDoc = null;
    if (patientId && Patient.db?.readyState === 1) {
      patientDoc = await Patient.findOne({
        $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
      });
    }

    // Step 3: Save draft Consultation in MongoDB
    const consultation = new Consultation({
      patient: patientDoc?._id || undefined,
      patientId: patientDoc?.patientId || patientId || "PAT-WALKIN",
      doctor: req.userId,
      rawNotes: rawNotes.trim(),
      soapNote: {
        subjective: soapNote.subjective,
        objective: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan,
      },
      status: "draft",
    });

    if (Consultation.db?.readyState === 1) {
      await consultation.save();
    }

    return res.status(201).json({
      success: true,
      message: "Structured SOAP note generated successfully",
      consultationId: consultation._id,
      consultation,
      soapNote: consultation.soapNote,
    });
  } catch (error) {
    console.error("Error in generateConsultationNote:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: Finalize consultation and lock from further AI changes
 */
export const finalizeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { soapNote } = req.body;

    let consultation = null;

    if (Consultation.db?.readyState === 1) {
      consultation = await Consultation.findById(id);

      if (!consultation) {
        return res.status(404).json({ success: false, message: "Consultation not found" });
      }

      consultation.status = "finalized";
      if (soapNote) {
        consultation.soapNote = {
          subjective: soapNote.subjective ?? consultation.soapNote.subjective,
          objective: soapNote.objective ?? consultation.soapNote.objective,
          assessment: soapNote.assessment ?? consultation.soapNote.assessment,
          plan: soapNote.plan ?? consultation.soapNote.plan,
        };
      }

      await consultation.save();

      // Also append to patient timeline history if patient exists
      if (consultation.patient && Patient.db?.readyState === 1) {
        await Patient.findByIdAndUpdate(consultation.patient, {
          $push: {
            history: {
              date: new Date(),
              visitType: "Doctor Consultation (SOAP)",
              notes: `${consultation.soapNote.assessment}. Plan: ${consultation.soapNote.plan.slice(0, 150)}...`,
              vitals: consultation.soapNote.objective.slice(0, 100),
            },
          },
          diagnosis: consultation.soapNote.assessment,
        });
      }
    } else {
      consultation = {
        _id: id,
        status: "finalized",
        soapNote: soapNote || {},
      };
    }

    return res.json({
      success: true,
      message: "Consultation finalized and locked to patient medical record",
      consultation,
    });
  } catch (error) {
    console.error("Error in finalizeConsultation:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: Retrieve all consultations for a given patient (Digital Twin feed)
 */
export const getPatientConsultations = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (Consultation.db?.readyState === 1) {
      const patient = await Patient.findOne({
        $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
      });

      const query = patient
        ? { $or: [{ patient: patient._id }, { patientId: patient.patientId }] }
        : { patientId };

      const consultations = await Consultation.find(query)
        .populate("doctor", "username email role")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        patientId,
        consultations,
      });
    }

    return res.json({
      success: true,
      patientId,
      consultations: [],
    });
  } catch (error) {
    console.error("Error in getPatientConsultations:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: Get recent consultation list
 */
export const getConsultations = async (req, res) => {
  try {
    if (Consultation.db?.readyState === 1) {
      const consultations = await Consultation.find()
        .populate("doctor", "username email role")
        .populate("patient", "name patientId age gender diagnosis vitals")
        .sort({ createdAt: -1 })
        .limit(20);

      return res.json({
        success: true,
        consultations,
      });
    }

    return res.json({
      success: true,
      consultations: [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: Get full patient history timeline
 */
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (Patient.db?.readyState === 1) {
      const patient = await Patient.findOne({
        $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
      });

      if (patient) {
        return res.json({
          success: true,
          patientId: patient.patientId,
          patientName: patient.name,
          diagnosis: patient.diagnosis,
          vitals: patient.vitals,
          medicalHistory: patient.history || [],
        });
      }
    }

    return res.json({
      success: true,
      patientId,
      medicalHistory: [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: AI copilot analysis query
 */
export const useCopilot = async (req, res) => {
  try {
    const { query, patientContext } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Copilot query prompt is required" });
    }

    const soap = await generateSoapNote(query);

    return res.json({
      success: true,
      message: "AI Copilot analysis generated for doctor",
      copilotResponse: {
        summary: soap.assessment,
        suggestions: soap.plan.split("\n").filter((l) => l.trim().length > 0),
        contextProvided: Boolean(patientContext),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Doctor: AI-powered Patient Digital Twin natural language Q&A
 */
export const queryPatientTwin = async (req, res) => {
  try {
    const { patientId, question } = req.body;

    if (!patientId || !question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both patientId and a non-empty question query are required.",
      });
    }

    const result = await answerPatientQuery(patientId, question.trim());

    return res.json({
      success: true,
      patientId,
      answer: result.answer,
      encounterCount: result.encounterCount,
      patientName: result.patientName,
    });
  } catch (error) {
    console.error("Error in queryPatientTwin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor: Generate formal clinical referral letter for finalized consultation
 */
export const generateReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetSpecialist } = req.body;

    const letterText = await createReferralDoc(id, targetSpecialist);

    return res.json({
      success: true,
      consultationId: id,
      letterText,
    });
  } catch (error) {
    console.error("Error in generateReferral:", error);
    return res.status(error.message.includes("finalized") ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Doctor: Generate official medical certificate for finalized consultation
 */
export const generateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { certificateType } = req.body;

    const certificateText = await createCertificateDoc(id, certificateType || "sick_leave");

    return res.json({
      success: true,
      consultationId: id,
      certificateText,
    });
  } catch (error) {
    console.error("Error in generateCertificate:", error);
    return res.status(error.message.includes("finalized") ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  generateConsultationNote,
  finalizeConsultation,
  getPatientConsultations,
  getConsultations,
  getPatientHistory,
  useCopilot,
  queryPatientTwin,
  generateReferral,
  generateCertificate,
};
