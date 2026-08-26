import mongoose from "mongoose";

const soapNoteSchema = new mongoose.Schema(
  {
    subjective: {
      type: String,
      default: "",
    },
    objective: {
      type: String,
      default: "",
    },
    assessment: {
      type: String,
      default: "",
    },
    plan: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientId: {
      type: String,
      default: "",
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rawNotes: {
      type: String,
      required: true,
      trim: true,
    },
    soapNote: {
      type: soapNoteSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Consultation = mongoose.model("Consultation", consultationSchema);

export default Consultation;
