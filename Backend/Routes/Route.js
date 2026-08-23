//Importing Packages
import express from 'express'
//Importing Files
import {register,login,logout,sendVerifyOtp,verifyEmail,isAuthenticated,sendResetOtp,resetPassword,getUserData} from '../controllers/AuthController.js'
import userAuth from '../Middlewares/AuthMiddleware.js'

const router = express.Router()

router.post('/register',register)
router.post('/login',login)
router.post('/logout',logout)
router.post('/send-otp',userAuth,sendVerifyOtp)
router.post('/verify-email',userAuth,verifyEmail)
router.post('/is-auth',userAuth,isAuthenticated)
router.post('/reset-password',resetPassword)
router.post('/send-reset-otp',sendResetOtp)
router.get('/get-user-data', userAuth ,getUserData)

export default router;