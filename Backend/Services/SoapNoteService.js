import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is not set in environment. SOAP Note generation will use clinical fallback.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy_key" });
  }
  return groqClient;
};

const SYSTEM_PROMPT = `You are an expert clinical AI documentation specialist.
Your task is to transform unstructured doctor consultation notes, patient dialogue, or examination notes into a standard, professional medical SOAP note.

You must respond ONLY with a valid JSON object with the following exact keys:
{
  "subjective": "Patient-reported symptoms, chief complaint, duration, history of presenting illness, review of systems, and pertinent medical history.",
  "objective": "Vital signs, physical examination findings, lab values, and clinical observations.",
  "assessment": "Primary clinical diagnosis and differential diagnoses with severity/phase classification.",
  "plan": "Structured numbered management plan: fluids/medications (names, doses), ordered investigations, warning signs/red flags, and follow-up timeline."
}

Do not include any conversational filler, markdown backticks, or text outside the JSON object.`;

/**
 * Transforms raw consultation notes into structured SOAP note via Groq LLM
 * @param {string} rawConsultationText - Unstructured clinical notes
 * @returns {Promise<{ subjective: string, objective: string, assessment: string, plan: string, isFallback: boolean }>}
 */
export const generateSoapNote = async (rawConsultationText) => {
  if (!rawConsultationText || !rawConsultationText.trim()) {
    throw new Error("Raw consultation text is required to generate a SOAP note.");
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // If GROQ_API_KEY is missing, perform smart heuristic fallback
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY missing, using structured clinical heuristic fallback.");
    return fallbackSoapExtraction(rawConsultationText);
  }

  const groq = getGroqClient();

  // Try calling Groq with JSON mode, retry once on error
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Raw Consultation Notes:\n${rawConsultationText}` },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty completion content received from Groq");
      }

      const parsed = JSON.parse(content);

      if (parsed.subjective || parsed.objective || parsed.assessment || parsed.plan) {
        return {
          subjective: parsed.subjective || "No subjective symptoms documented.",
          objective: parsed.objective || "Vitals and examination findings not specified.",
          assessment: parsed.assessment || "Clinical assessment pending diagnostic confirmation.",
          plan: parsed.plan || "Follow standard clinical protocol and re-evaluate.",
          isFallback: false,
        };
      }
    } catch (error) {
      console.warn(`⚠️ Groq SOAP generation attempt ${attempt} failed:`, error.message);
      if (attempt === 2) {
        return fallbackSoapExtraction(rawConsultationText, error.message);
      }
    }
  }

  return fallbackSoapExtraction(rawConsultationText);
};

/**
 * Fallback extraction when LLM API is unavailable or JSON fails
 */
function fallbackSoapExtraction(rawText, errorMsg = "") {
  return {
    subjective: `Patient presented with: ${rawText.slice(0, 250)}...`,
    objective: "Vital signs and physical exam recorded in raw consultation transcript.",
    assessment: `Clinical assessment based on notes: ${rawText.slice(0, 180)}`,
    plan: "1. Complete CBC and baseline diagnostics.\n2. Supportive care and symptomatic relief.\n3. Advise patient on warning signs and follow up in 48 hours.",
    isFallback: true,
    warning: errorMsg ? `AI generation notice: ${errorMsg}` : undefined,
  };
}

export default {
  generateSoapNote,
};
