import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// console.log(process.env.SMTP_PASS)
// console.log(process.env.SMTP_PASS)
const transporter = nodemailer.createTransport({
    host:"",
    port:587,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    }
})

export default transporter