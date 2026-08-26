import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../Models/User.js";
import Patient from "../Models/Patient.js";

dotenv.config();

const seedDemoData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/MyDB";
    console.log("Connecting to MongoDB for demo seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    console.log("\n=======================================================");
    console.log("🏥 MedFlowAI — Seeding Realistic Demo Data");
    console.log("=======================================================\n");

    // 1. SEED USERS
    const demoUsers = [
      {
        username: "AdminUser",
        email: "admin@medflow.demo",
        password: "Admin@123",
        role: "admin",
      },
      {
        username: "DrSarahChen",
        email: "doctor@medflow.demo",
        password: "Doctor@123",
        role: "doctor",
      },
      {
        username: "ReceptionDesk",
        email: "reception@medflow.demo",
        password: "Reception@123",
        role: "receptionist",
      },
    ];

    const seededUserMap = {};

    for (const u of demoUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        existing = new User({
          username: u.username,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          isAccountVerified: true,
        });
        await existing.save();
        console.log(`👤 Created user: ${u.username} (${u.email}) [Role: ${u.role}]`);
      } else {
        console.log(`ℹ️  User already exists: ${u.email} [Role: ${existing.role}]`);
      }
      seededUserMap[u.role] = existing;
    }

    // 2. SEED PATIENTS
    const demoPatients = [
      {
        patientId: "PAT-892143",
        name: "Tariq Mahmood",
        age: 42,
        gender: "Male",
        contactNumber: "+92 300 1234567",
        address: "Gulshan-e-Iqbal, Block 4, Karachi",
        diagnosis: "Suspected Dengue Fever with Thrombocytopenia",
        vitals: {
          bp: "118/76 mmHg",
          pulse: 88,
          temp: "101.4°F",
          spo2: "98%",
        },
        registeredBy: seededUserMap.receptionist?._id,
        history: [
          {
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            visitType: "Emergency Triage",
            notes: "Patient presented with acute onset high fever, severe frontal headache, retro-orbital pain, and generalized body aches.",
            vitals: "BP: 120/80 mmHg | Temp: 102.1°F | Pulse: 92 bpm",
            labResults: "Platelets: 185,000/μL, Hemoglobin: 14.2 g/dL, HCT: 39%",
          },
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            visitType: "OPD Follow-up",
            notes: "Persistent pyrexia despite antipyretics. Mild petechiae noted on bilateral forearms. Advised strict hydration.",
            vitals: "BP: 116/74 mmHg | Temp: 101.8°F | Pulse: 86 bpm",
            labResults: "Platelets: 110,000/μL, NS1 Antigen: POSITIVE",
          },
          {
            date: new Date(),
            visitType: "HDU Admission Consultation",
            notes: "Critical phase entry. Platelets dropped to 85k. Started on intravenous fluid resuscitation protocol per Dengue SOP.",
            vitals: "BP: 118/76 mmHg | Temp: 101.4°F | Pulse: 88 bpm",
            labResults: "Platelets: 85,000/μL, HCT: 41%, Dengue IgG/IgM: Reactive",
          },
        ],
      },
      {
        patientId: "PAT-441209",
        name: "Fatima Zahra",
        age: 29,
        gender: "Female",
        contactNumber: "+92 333 9876543",
        address: "PECHS Block 2, Karachi",
        diagnosis: "Acute Upper Respiratory Tract Infection (URTI)",
        vitals: {
          bp: "110/70 mmHg",
          pulse: 74,
          temp: "99.2°F",
          spo2: "99%",
        },
        registeredBy: seededUserMap.receptionist?._id,
        history: [
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            visitType: "General OPD",
            notes: "Sore throat, nasal congestion, and mild dry cough for 3 days. Chest clear on auscultation.",
            vitals: "BP: 110/70 mmHg | Temp: 99.2°F | Pulse: 74 bpm",
            labResults: "Throat swab clear. CBC within normal parameters.",
          },
        ],
      },
      {
        patientId: "PAT-773190",
        name: "Bilal Ahmed",
        age: 55,
        gender: "Male",
        contactNumber: "+92 321 5556677",
        address: "North Nazimabad, Karachi",
        diagnosis: "Type 2 Diabetes Mellitus with Essential Hypertension",
        vitals: {
          bp: "135/88 mmHg",
          pulse: 80,
          temp: "98.6°F",
          spo2: "97%",
        },
        registeredBy: seededUserMap.receptionist?._id,
        history: [
          {
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            visitType: "Routine Endocrine Review",
            notes: "Fasting blood glucose 145 mg/dL, HbA1c 7.4%. Prescribed Metformin 500mg BD and lifestyle modification.",
            vitals: "BP: 135/88 mmHg | Temp: 98.6°F",
            labResults: "HbA1c: 7.4%, Serum Creatinine: 0.9 mg/dL",
          },
        ],
      },
    ];

    for (const p of demoPatients) {
      let existingPat = await Patient.findOne({ patientId: p.patientId });
      if (!existingPat) {
        existingPat = new Patient(p);
        await existingPat.save();
        console.log(`🩺 Created Patient: ${p.name} (${p.patientId}) - ${p.diagnosis}`);
      } else {
        console.log(`ℹ️  Patient already exists: ${p.name} (${p.patientId})`);
      }
    }

    console.log("\n=======================================================");
    console.log("🔑 DEMO LOGIN CREDENTIALS");
    console.log("=======================================================");
    console.log("1. ADMIN ROLE:");
    console.log("   Email:    admin@medflow.demo");
    console.log("   Password: Admin@123");
    console.log("   Access:   Full Document Management + Knowledge Copilot + Workspace\n");

    console.log("2. DOCTOR ROLE:");
    console.log("   Email:    doctor@medflow.demo");
    console.log("   Password: Doctor@123");
    console.log("   Access:   Consultation Copilot + Patient Timeline + Embedded Knowledge\n");

    console.log("3. RECEPTIONIST ROLE:");
    console.log("   Email:    reception@medflow.demo");
    console.log("   Password: Reception@123");
    console.log("   Access:   Patient Registration + Knowledge Copilot Search\n");
    console.log("=======================================================\n");

    await mongoose.disconnect();
    console.log("Database connection closed cleanly.");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
};

seedDemoData();
