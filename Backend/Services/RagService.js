import Groq from "groq-sdk";
import dotenv from "dotenv";
import { retrieveRelevantChunks } from "./RetrievalService.js";
import ChatHistory from "../Models/ChatHistory.js";

dotenv.config();

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is not configured in environment.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy_key" });
  }
  return groqClient;
};

/**
 * Builds strict grounding system prompt with citations
 */
export const buildSystemPrompt = (retrievedChunks) => {
  let contextBlock = "";

  retrievedChunks.forEach((chunk, index) => {
    contextBlock += `\n--- [EXCERPT ${index + 1}] ---\nDocument: "${chunk.documentName}"\nSection: ${chunk.section}\nPage: ${chunk.page}\nCategory: ${chunk.category}\nContent:\n${chunk.chunkText}\n`;
  });

  return `You are MedFlowAI Clinic Knowledge Assistant, an official clinical intelligence assistant.

CRITICAL GROUNDING RULES:
1. Answer the user's question using ONLY the provided CONTEXT excerpts from official clinic documents.
2. If the answer is NOT explicitly or fully contained in the context, clearly state: "I don't have that information in the uploaded clinic documents." Do NOT attempt to guess, extrapolate, or use outside medical knowledge.
3. For every statement, fact, guideline, or recommendation you provide, you MUST cite the source document, section, and page number using this exact format: [Document: <Name>, Section: <Section>, Page: <Number>].
4. Format your response cleanly using bullet points, headings, and clear clinical phrasing.

CONTEXT:
${contextBlock}
`;
};

/**
 * Orchestrates RAG flow and streams response via Server-Sent Events (SSE)
 * @param {string} question - User question
 * @param {import('express').Response} res - Express response stream
 * @param {string} userId - ID of authenticated staff user
 */
export const streamAnswer = async (question, res, userId) => {
  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let fullAnswer = "";
  let sources = [];

  try {
    // Step 1: Retrieve relevant chunks with hallucination threshold
    const chunks = await retrieveRelevantChunks(question, 5, 0.65);

    // Step 2: Handle zero-match scenario
    if (!chunks || chunks.length === 0) {
      const zeroMatchMsg = "I apologize, but this information is not found in the uploaded clinic documents. Please verify with clinic administration or refer to official SOP guidelines.";
      
      // Stream tokens simulating immediate refusal
      res.write(`data: ${JSON.stringify({ token: zeroMatchMsg })}\n\n`);
      res.write(`event: sources\ndata: ${JSON.stringify([])}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();

      // Save to chat history
      if (userId) {
        try {
          await ChatHistory.create({
            user: userId,
            question,
            answer: zeroMatchMsg,
            sources: [],
          });
        } catch (dbErr) {
          console.error("Failed to save zero-match chat history:", dbErr.message);
        }
      }
      return;
    }

    // Step 3: Extract structured sources (deduplicate)
    const seenSourceKeys = new Set();
    for (const chunk of chunks) {
      const key = `${chunk.documentId}-${chunk.page}-${chunk.section}`;
      if (!seenSourceKeys.has(key)) {
        seenSourceKeys.add(key);
        sources.push({
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          page: chunk.page,
          section: chunk.section,
        });
      }
    }

    // Step 4: Stream inference from Groq
    const groq = getGroqClient();
    const systemPrompt = buildSystemPrompt(chunks);
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const chatCompletion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of chatCompletion) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        fullAnswer += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Step 5: Send final structured sources event
    res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();

    // Step 6: Save Chat History record
    if (userId) {
      try {
        await ChatHistory.create({
          user: userId,
          question,
          answer: fullAnswer,
          sources,
        });
      } catch (dbErr) {
        console.error("Failed to save chat history record:", dbErr.message);
      }
    }
  } catch (error) {
    console.error("Error in RAG streamAnswer:", error.message);
    const errorMsg = `\n\n[Error generating response: ${error.message}]`;
    res.write(`data: ${JSON.stringify({ token: errorMsg, error: true })}\n\n`);
    res.write(`event: sources\ndata: ${JSON.stringify([])}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
};

export default {
  buildSystemPrompt,
  streamAnswer,
};
