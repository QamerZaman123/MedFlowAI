import mongoose from "mongoose";

const visitHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    visitType: {
      type: String,
      default: "General Consultation",
    },
    notes: {
      type: String,
      default: "",
    },
    vitals: {
      type: String,
      default: "",
    },
    labResults: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    contactNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    vitals: {
      bp: { type: String, default: "120/80 mmHg" },
      pulse: { type: Number, default: 75 },
      temp: { type: String, default: "98.6°F" },
      spo2: { type: String, default: "99%" },
    },
    diagnosis: {
      type: String,
      default: "",
    },
    history: {
      type: [visitHistorySchema],
      default: [],
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
