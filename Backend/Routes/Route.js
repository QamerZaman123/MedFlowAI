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
  useCopilot
} from '../Controllers/DoctorController.js'

// Importing Middlewares
import userAuth, { authorize } from '../Middlewares/AuthMiddleware.js'

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

// ==================== DOCTOR-ONLY ROUTES ====================
router.get('/doctor/consultations', userAuth, authorize('doctor'), getConsultations)
router.get('/doctor/patient-history/:patientId', userAuth, authorize('doctor'), getPatientHistory)
router.post('/doctor/copilot', userAuth, authorize('doctor'), useCopilot)

// ==================== RECEPTIONIST-ONLY ROUTES ====================
router.post('/receptionist/patients', userAuth, authorize('receptionist'), registerPatient)
router.put('/receptionist/patients/:id', userAuth, authorize('receptionist'), updatePatientInfo)

// ==================== SHARED ACCESS ROUTES ====================
router.get('/patients/search', userAuth, authorize('admin', 'doctor', 'receptionist'), searchPatients)

export default router;