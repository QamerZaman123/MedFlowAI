import { v2 as cloudinary } from "cloudinary";
import path from "path";
import Document from "../Models/Document.js";
import ChatHistory from "../Models/ChatHistory.js";
import { ingestDocument } from "../Services/IngestionService.js";
import { streamAnswer } from "../Services/RagService.js";
import { getQdrantClient, QDRANT_COLLECTION } from "../Config/QdrantConfig.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads raw buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey || cloudName === "your_cloud_name" || apiKey.includes("your_cloudinary_api_key")) {
      console.log("ℹ️ Cloudinary credentials not configured or set to placeholder; bypassing remote asset upload.");
      return resolve({ secure_url: "", public_id: "" });
    }

    const cleanFilename = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "clinic_documents",
        public_id: `${Date.now()}-${cleanFilename}`,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Deletes file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Cloudinary destruction error:", error.message);
  }
};

/**
 * Admin: Upload and process clinic document (PDF, DOCX, TXT)
 */
export const uploadDocument = async (req, res) => {
  try {
    const maxFileSize = 15 * 1024 * 1024; // 15MB
    if (req.file.size > maxFileSize) {
      return res.status(413).json({
        success: false,
        message: "File size exceeds the 15MB limit. Please upload a smaller document.",
      });
    }

    const originalFilename = req.file.originalname;
    const ext = path.extname(originalFilename).toLowerCase().replace(/^\./, "");

    if (!["pdf", "docx", "txt"].includes(ext)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Supported formats are: .pdf, .docx, and .txt",
      });
    }

    const title = req.body.title || originalFilename.replace(/\.[^/.]+$/, "");
    const category = req.body.category || "Other";

    // 1. Upload raw file to Cloudinary
    let cloudinaryUrl = "";
    let cloudinaryPublicId = "";
    try {
      const uploadRes = await uploadToCloudinary(req.file.buffer, originalFilename);
      cloudinaryUrl = uploadRes.secure_url || "";
      cloudinaryPublicId = uploadRes.public_id || "";
    } catch (uploadErr) {
      console.warn("Cloudinary upload failed, continuing with local ingestion:", uploadErr.message);
    }

    // 2. Create Document Mongo record with status = 'processing'
    const newDoc = new Document({
      title,
      originalFilename,
      fileType: ext,
      cloudinaryUrl,
      cloudinaryPublicId,
      uploadedBy: req.userId,
      status: "processing",
      chunkCount: 0,
      category,
    });

    await newDoc.save();

    // 3. Respond immediately so client is not blocked on OCR/embeddings
    res.status(202).json({
      success: true,
      message: "Document upload received. Ingestion and indexing started in background.",
      documentId: newDoc._id,
      document: newDoc,
    });

    // 4. Trigger asynchronous ingestion pipeline
    ingestDocument(req.file.buffer, ext, {
      documentId: newDoc._id,
      documentName: newDoc.title,
      category: newDoc.category,
    }).catch((ingestErr) => {
      console.error(`Background ingestion failure for document ${newDoc._id}:`, ingestErr.message);
    });
  } catch (error) {
    console.error("Error in uploadDocument:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * Admin: List all uploaded clinic documents
 */
export const listDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate("uploadedBy", "username email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error in listDocuments:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete document from MongoDB, Cloudinary, and Qdrant vector collection
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // 1. Delete from Cloudinary
    if (document.cloudinaryPublicId) {
      await deleteFromCloudinary(document.cloudinaryPublicId);
    }

    // 2. Delete vectors from Qdrant by documentId filter
    try {
      const qdrant = getQdrantClient();
      await qdrant.delete(QDRANT_COLLECTION, {
        filter: {
          must: [
            {
              key: "documentId",
              match: {
                value: String(id),
              },
            },
          ],
        },
      });
      console.log(`🗑️ Deleted Qdrant points matching documentId: ${id}`);
    } catch (qdrantErr) {
      console.error("Failed to delete points from Qdrant:", qdrantErr.message);
    }

    // 3. Delete from MongoDB
    await Document.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Document, cloud asset, and vector index successfully deleted.",
    });
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Authenticated Staff (Admin, Doctor, Receptionist): Query Knowledge Base with RAG SSE Stream
 */
export const queryKnowledge = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: "Question query is required" });
    }

    await streamAnswer(question, res, req.userId);
  } catch (error) {
    console.error("Error in queryKnowledge:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * Authenticated Staff: Retrieve personal chat history
 */
export const getChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  uploadDocument,
  listDocuments,
  deleteDocument,
  queryKnowledge,
  getChatHistory,
};
