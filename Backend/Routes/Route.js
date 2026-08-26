// Importing Packages
import express from 'express'

// Importing Controllers
import {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
  getUserData,
  createUserByAdmin,
  getAllUsers
} from '../Controllers/AuthController.js'

import {
  registerPatient,
  searchPatients,
  updatePatientInfo
} from '../Controllers/PatientController.js'

import {
  getConsultations,
  getPatientHistory,
  useCopilot,
  generateConsultationNote,
  finalizeConsultation,
  getPatientConsultations,
  queryPatientTwin,
  generateReferral,
  generateCertificate
} from '../Controllers/DoctorController.js'

import {
  uploadDocument,
  listDocuments,
  deleteDocument,
  queryKnowledge,
  getChatHistory
} from '../Controllers/KnowledgeController.js'

// Importing Middlewares
import userAuth, { authorize } from '../Middlewares/AuthMiddleware.js'
import multer from 'multer'

// Multer memory storage configuration (Max 15MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    const isAllowedExt = /\.(pdf|docx|txt)$/i.test(file.originalname);
    if (allowedTypes.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .docx, and .txt files are allowed!'), false);
    }
  }
})

const router = express.Router()

// ==================== PUBLIC AUTH ROUTES ====================
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/send-reset-otp', sendResetOtp)
router.post('/reset-password', resetPassword)

// ==================== AUTHENTICATED USER ROUTES ====================
router.post('/send-otp', userAuth, sendVerifyOtp)
router.post('/verify-email', userAuth, verifyEmail)
router.post('/is-auth', userAuth, isAuthenticated)
router.get('/get-user-data', userAuth, getUserData)

// ==================== ADMIN-ONLY ROUTES ====================
router.post('/admin/create-user', userAuth, authorize('admin'), createUserByAdmin)
router.get('/admin/users', userAuth, authorize('admin'), getAllUsers)

// Admin Knowledge Base Management
router.post('/admin/knowledge/documents', userAuth, authorize('admin'), upload.single('file'), uploadDocument)
router.get('/admin/knowledge/documents', userAuth, authorize('admin'), listDocuments)
router.delete('/admin/knowledge/documents/:id', userAuth, authorize('admin'), deleteDocument)

// ==================== DOCTOR-ONLY ROUTES ====================
router.get('/doctor/consultations', userAuth, authorize('doctor', 'admin'), getConsultations)
router.get('/doctor/patient-history/:patientId', userAuth, authorize('doctor', 'admin'), getPatientHistory)
router.post('/doctor/copilot', userAuth, authorize('doctor', 'admin'), useCopilot)

// Real AI Consultation Copilot Routes
router.post('/doctor/consultations/generate', userAuth, authorize('doctor', 'admin'), generateConsultationNote)
router.post('/doctor/consultations/:id/finalize', userAuth, authorize('doctor', 'admin'), finalizeConsultation)
router.get('/doctor/consultations/patient/:patientId', userAuth, authorize('doctor', 'admin'), getPatientConsultations)
router.post('/doctor/patient-twin/query', userAuth, authorize('doctor', 'admin'), queryPatientTwin)
router.post('/doctor/consultations/:id/referral', userAuth, authorize('doctor', 'admin'), generateReferral)
router.post('/doctor/consultations/:id/certificate', userAuth, authorize('doctor', 'admin'), generateCertificate)

// ==================== RECEPTIONIST-ONLY ROUTES ====================
router.post('/receptionist/patients', userAuth, authorize('receptionist', 'admin'), registerPatient)
router.put('/receptionist/patients/:id', userAuth, authorize('receptionist', 'admin'), updatePatientInfo)

// ==================== SHARED ACCESS ROUTES ====================
router.get('/patients/search', userAuth, authorize('admin', 'doctor', 'receptionist'), searchPatients)

// Shared Staff Knowledge Query & History
router.post('/knowledge/query', userAuth, queryKnowledge)
router.get('/knowledge/history', userAuth, getChatHistory)

export default router;