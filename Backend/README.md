# User Authentication & Authorization API (Backend)

A secure and scalable **Node.js + Express authentication system** implementing **JWT-based authentication with cookie-based sessions**, email verification, and password recovery functionality.

---

## 🧠 Project Overview

This backend provides a complete **authentication and authorization system** for modern web applications. It includes user lifecycle management from registration to password recovery with secure email workflows.

### Core Capabilities
- User registration with email verification
- Secure login with JWT (cookie-based authentication)
- Logout with cookie clearing
- Protected routes using middleware authentication
- Password reset via OTP email flow
- Email verification system
- User session validation
- Fetch authenticated user data

---

## ⚙️ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- HttpOnly cookie session handling
- Middleware-based route protection
- Secure logout mechanism

### 📧 Email System (Brevo SMTP)
- Welcome email on user registration
- Email verification OTP system
- Password reset OTP system
- Secure SMTP integration via Brevo

### 👤 User Management
- Register user
- Login user
- Logout user
- Get authenticated user data

### 🔁 OTP Workflows
- Send verification OTP
- Verify email using OTP
- Send password reset OTP
- Reset password securely

---

## 🏗️ Architecture

- **Backend Framework** → Node.js + Express.js
- **Database** → MongoDB (Mongoose ODM)
- **Authentication** → JWT (Cookie-based)
- **Email Service** → Brevo SMTP (Nodemailer)
- **Security Layer** → Middleware-based JWT verification

---

## 📁 Folder Structure


backend/
│
├── Controllers/
│ └── AuthController.js
│
├── Routes/
│ └── Route.js
│
├── Middlewares/
│ └── AuthMiddleware.js
│
├── Models/
│ └── User.js
│
├── Config/
│ ├── DBConfig.js
│ └── Nodemailer.js
│
└── server.js


---

## ✉️ Brevo SMTP Setup (for Nodemailer)

Follow these steps to configure Brevo SMTP for sending emails:

### 1️⃣ Open Brevo Dashboard

Go to: **[https://app.brevo.com/](https://app.brevo.com/)**

---

### 2️⃣ Get Your SMTP Login

Inside Brevo dashboard → SMTP & API section:

* **SMTP Login Email:**
  Example: `45effdw@smtp-brevo.com`
  Add it to your `.env` file as:

  ```env
  SMTP_USER=45effdw@smtp-brevo.com
  ```

* **Generate New SMTP Key:**
  Add it to `.env` as:

  ```env
  SMTP_PASS=your_smtp_key
  ```

* **SMTP Server:**
  Use this in your Nodemailer config file:

  ```js
  host: "smtp-relay.brevo.com"
  ```

---

## 🔐 Environment Variables (.env File)

Create a `.env` file in the root of your project and add:

```env
MONGO_URI='Your Uri'
PORT=3000
JWT_SECRET='kfjhsur'
COOKIE_NAME='mycookie'

SMTP_USER=''
SMTP_PASS=''
SENDER_EMAIL=''

NODE_ENV='development'
```

---

## 📝 Notes

* Make sure your MongoDB URI is correct.
* `JWT_SECRET` should be a strong, unique string.
* `COOKIE_NAME` is the name of the HttpOnly cookie used for authentication.
* `SENDER_EMAIL` is the email address from which emails will be sent. And used for Brevo account creation.

---
## 📦 Install Dependencies

Install all required packages:

```bash
npm i express nodemailer mongoose dotenv cookie-parser cors jsonwebtoken bcrypt
```
