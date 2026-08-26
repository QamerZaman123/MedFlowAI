import { createRequire } from "module";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extracts text from PDF with page-level metadata and OCR fallback for scanned documents
 * @param {Buffer} buffer - Raw file buffer
 * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }> }>}
 */
export const extractFromPdf = async (buffer) => {
  const pages = [];

  try {
    const options = {
      pagerender: async function (pageData) {
        try {
          const textContent = await pageData.getTextContent();
          let pageText = "";
          let lastY;

          for (const item of textContent.items) {
            if (lastY === item.transform[5] || lastY === undefined) {
              pageText += (pageText ? " " : "") + item.str;
            } else {
              pageText += "\n" + item.str;
            }
            lastY = item.transform[5];
          }

          const trimmed = pageText.trim();
          pages.push({
            pageNumber: pageData.pageIndex + 1,
            text: trimmed,
          });

          return pageText;
        } catch (e) {
          pages.push({
            pageNumber: pageData.pageIndex + 1,
            text: "",
          });
          return "";
        }
      },
    };

    const pdfData = await pdfParse(buffer, options);
    let fullText = (pdfData.text || "").trim();

    // Check if text extraction resulted in near-empty text (scanned PDF / image PDF)
    const totalExtractedLength = pages.reduce((acc, p) => acc + p.text.length, 0);

    if (totalExtractedLength < 50) {
      console.warn("⚠️ PDF text is empty or near-empty. Attempting OCR fallback with Tesseract.js...");
      try {
        const worker = await createWorker("eng");
        const ocrResult = await worker.recognize(buffer);
        await worker.terminate();

        const ocrText = ocrResult?.data?.text?.trim() || "";
        if (ocrText.length > 0) {
          fullText = ocrText;
          pages.length = 0;
          pages.push({
            pageNumber: 1,
            text: ocrText,
          });
        }
      } catch (ocrErr) {
        console.error("OCR fallback failed:", ocrErr.message);
      }
    }

    // Ensure we have at least one page structure
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: fullText,
      });
    }

    return {
      fullText,
      pages,
    };
  } catch (error) {
    console.error("Error parsing PDF:", error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Extracts raw text from DOCX files
 * @param {Buffer} buffer - Raw file buffer
 * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }> }>}
 */
export const extractFromDocx = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = (result.value || "").trim();

    // DOCX files don't carry hard page boundaries, but we can split by form-feed or sections
    const rawPages = fullText.split(/\f|\r?\n\s*\r?\n\s*\r?\n/);
    const pages = rawPages
      .filter((p) => p.trim().length > 0)
      .map((text, idx) => ({
        pageNumber: idx + 1,
        text: text.trim(),
      }));

    return {
      fullText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }],
    };
  } catch (error) {
    console.error("Error parsing DOCX:", error.message);
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
};

/**
 * Extracts text from plain TXT files
 * @param {Buffer} buffer - Raw file buffer
 * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }> }>}
 */
export const extractFromTxt = async (buffer) => {
  try {
    const fullText = buffer.toString("utf-8").trim();
    const rawPages = fullText.split(/\f/);
    const pages = rawPages
      .filter((p) => p.trim().length > 0)
      .map((text, idx) => ({
        pageNumber: idx + 1,
        text: text.trim(),
      }));

    return {
      fullText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }],
    };
  } catch (error) {
    console.error("Error parsing TXT:", error.message);
    throw new Error(`Failed to parse TXT: ${error.message}`);
  }
};

/**
 * Universal router for document parsing
 */
export const parseDocument = async (buffer, fileType) => {
  const normalizedType = (fileType || "").toLowerCase().replace(/^\./, "");
  let result;
  switch (normalizedType) {
    case "pdf":
      result = await extractFromPdf(buffer);
      break;
    case "docx":
      result = await extractFromDocx(buffer);
      break;
    case "txt":
      result = await extractFromTxt(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}. Supported types: pdf, docx, txt`);
  }

  if (!result || !result.fullText || result.fullText.trim().length === 0) {
    throw new Error("No extractable text found in this document. Please verify the file is not empty, password-protected, or corrupted.");
  }

  return result;
};

export default {
  extractFromPdf,
  extractFromDocx,
  extractFromTxt,
  parseDocument,
};
