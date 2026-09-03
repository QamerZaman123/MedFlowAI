# 🏥 MedFlowAI — Grounded Clinical Intelligence & Knowledge Platform

> **Bano Qabil Hackathon Submission**  
> An AI-powered Clinical Decision Support & Knowledge Assistant built for healthcare professionals, featuring **zero-hallucination grounding**, **automated OCR ingestion**, **Qdrant vector retrieval**, and **role-based clinical workflows**.

---

## 💡 Overview & Problem Statement

Modern clinical staff spend up to **40% of their workday searching through hospital SOPs, emergency protocols, and fragmented patient records**. General-purpose AI models are prone to clinical hallucinations, which are unacceptable in medical environments.

**MedFlowAI solves this by providing:**
1. **Strict Zero-Hallucination Knowledge Retrieval**: Answers are generated **exclusively** from verified hospital SOPs, clinical protocols, and medical policies. If information is not in the uploaded documents, the assistant strictly refuses to guess.
2. **Deterministic Citations**: Every generated sentence or recommendation cites the exact **Document Name, Section, and Page Number**.
3. **Unified Doctor Workspace**: Clinicians can generate structured **SOAP notes**, inspect a patient's **Digital Twin Timeline**, and query the **Knowledge Copilot** directly inside their consultation workflow without context switching.
4. **Resilient Document Ingestion Pipeline**: Automatically processes **PDF, DOCX, and TXT** documents, detects section headers, chunks with semantic overlap, generates 768-dim embeddings via **Google Gemini `text-embedding-004`**, and indexes into **Qdrant Vector Database**, featuring an automatic **Tesseract.js OCR fallback** for scanned documents.

---

## 🏗️ Architecture & Data Flow

```
                                  [ CLINICAL USERS ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  [Doctor Role]                  [Receptionist Role]                [Admin Role]
  Doctor Workspace & Timeline     Patient Registration            Document Manager
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         │
                                         ▼
                     [ Next.js 14 + Tailwind CSS Frontend ]
                     (Role-Aware Unified Navigation Layout)
                                         │
                                         │ HttpOnly Cookie JWT Auth (credentials: 'include')
                                         │ SSE Streaming Streams (text/event-stream)
                                         ▼
                       [ Express.js REST API Server ]
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          ▼                              ▼                              ▼
  [ Auth & Middlewares ]       [ Ingestion Pipeline ]         [ RAG & Retrieval ]
  • userAuth (Cookie JWT)      • ParsingService (PDF/DOCX/TXT) • EmbeddingService (Gemini)
  • authorize('role')          • Tesseract.js OCR Fallback    • RetrievalService (>0.65 threshold)
  • Multer (15MB Limit)        • Chunking & Section Detector  • RagService (Groq Llama 3.3 70B)
          │                              │                              │
          ▼                              ▼                              ▼
  [ MongoDB Database ]          [ Cloudinary Storage ]        [ Qdrant Vector DB ]
  • Users (RBAC)               • Raw SOP document files       • 768-dim vector embeddings
  • Documents (Status & Chunks)                               • Document metadata & payloads
  • Patients (Digital Twin)
  • ChatHistory (Audit logs)
```

---

## 🔑 Demo Login Credentials

Pre-seeded accounts ready for live testing and demonstration:

| Role | Email | Password | Allowed Access & Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@medflow.demo` | `Admin@123` | Document Manager (Upload/Delete SOPs), Doctor Workspace, Knowledge Copilot |
| **Doctor** | `doctor@medflow.demo` | `Doctor@123` | Consultation Copilot (SOAP Notes), Digital Twin Timeline, Embedded Knowledge Copilot |
| **Receptionist** | `reception@medflow.demo` | `Reception@123` | Patient Onboarding & Search, Staff Knowledge Copilot |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0+ or v20.0+ (Tested on v22.17.0)
- **MongoDB**: Local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Configure Environment Variables
Create or update `Backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development
COOKIE_NAME=mycookie
JWT_SECRET=medflowai_secure_jwt_secret_key_2026

# Database
MONGO_URI=mongodb://127.0.0.1:27017/MyDB

# Qdrant Vector DB
QDRANT_URL=https://your-qdrant-cluster.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=clinic_knowledge_base

# Google Gemini (Embeddings)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Groq (LLM Inference)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Cloudinary (Raw Document Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Install Dependencies & Seed Demo Data
```bash
# In Backend/
cd Backend
npm install
node scripts/seedDemoData.js

# In Frontend/
cd ../Frontend
npm install
```

### 4. Run Both Servers
```bash
# Terminal 1 - Backend (Port 3000)
cd Backend
node server.js

# Terminal 2 - Frontend (Port 3001)
cd Frontend
npm run dev
```

Visit the application at: **[http://localhost:3001](http://localhost:3001)**

---

## 🧪 Verification & Sanity Scripts

Quick test scripts to verify the pipeline offline or end-to-end:

```bash
cd Backend

# 1. Test Ingestion, Chunking, Embeddings, and Retrieval
node scripts/testKnowledgePipeline.js

# 2. Test Tesseract.js OCR Subsystem
node scripts/testOcrFallback.js
```

---

## 🛠️ Tech Stack Matrix

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router), React 18 | High-performance clinical web UI & streaming reader |
| **Styling & Icons** | Tailwind CSS, Lucide React | Clinical teal/medical blue aesthetic, responsive design |
| **Backend Framework** | Node.js, Express.js 5 | Modular REST API and Server-Sent Events (SSE) server |
| **Authentication** | JWT (jsonwebtoken, bcrypt, cookie-parser) | HttpOnly cookie-based sessions with RBAC middleware |
| **Vector Database** | Qdrant Cloud (`@qdrant/js-client-rest`) | Real-time cosine similarity search with payload filtering |
| **Embeddings** | Google Gemini (`text-embedding-004`) | 768-dimensional clinical semantic embeddings |
| **LLM Inference** | Groq SDK (`llama-3.3-70b-versatile`) | Ultra-fast token-by-token streaming clinical synthesis |
| **Document Parsers** | `pdf-parse`, `mammoth`, `tesseract.js` | Multi-format parsing (PDF, DOCX, TXT) with OCR fallback |
| **Cloud Storage** | Cloudinary | Raw hospital document archival |
| **Primary Database** | MongoDB (Mongoose ODM) | User auth, patient history records, and document metadata |

---

## 🛡️ Role-Based Access Control (RBAC) & Routes

| Route | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | Public | Register new user account |
| `/api/login` | `POST` | Public | Login & issue HttpOnly JWT cookie |
| `/api/logout` | `POST` | Authenticated | Clear session cookie |
| `/api/get-user-data` | `GET` | Authenticated | Fetch active user profile and role |
| `/api/knowledge/query` | `POST` | All Staff (`admin`, `doctor`, `receptionist`) | Stream grounded answers with citations via SSE |
| `/api/knowledge/history` | `GET` | All Staff (`admin`, `doctor`, `receptionist`) | Fetch personal question/answer history |
| `/api/doctor/copilot` | `POST` | Doctor (`doctor`, `admin`) | Generate clinical SOAP notes and treatment plans |
| `/api/doctor/patient-history/:id` | `GET` | Doctor (`doctor`, `admin`) | Fetch Digital Twin patient timeline |
| `/api/admin/knowledge/documents` | `POST` | Admin (`admin`) | Upload document & initiate background vectoring |
| `/api/admin/knowledge/documents` | `GET` | Admin (`admin`) | List uploaded documents and indexing statuses |
| `/api/admin/knowledge/documents/:id` | `DELETE` | Admin (`admin`) | Purge document from Mongo, Cloudinary & Qdrant |

---

## 🔍 Known Limitations & Hackathon Roadmap

1. **OCR Processing Latency**: Tesseract.js processing on image-heavy, multi-page scanned PDFs runs client/server-side and may take 5–15 seconds per page. The UI provides real-time animated status polling (`processing` → `indexed`) to give transparent feedback.
2. **Single-Tenant Clinic Model**: Current version is architected for a single medical facility. Multi-clinic tenant isolation with separate Qdrant collection namespaces is planned for v3.0.
3. **EHR Integration**: Digital Twin timelines currently integrate with internal MongoDB schemas; FHIR / HL7 standard adapter export is on the future roadmap.

---

## 👥 Contributors & Credits
- **Team MedFlowAI** — Bano Qabil Hackathon 2026
- Built with ❤️ using Next.js, Express, Qdrant, Google Gemini, Groq, and Tailwind CSS.
