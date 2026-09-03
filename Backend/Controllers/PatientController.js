<<<<<<< HEAD
export const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, contactNumber, address } = req.body;
=======
import Patient from "../Models/Patient.js";

export const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, contactNumber, address, diagnosis, vitals } = req.body;
>>>>>>> moiz
    if (!name || !age || !gender) {
      return res.status(400).json({ success: false, message: "Patient name, age, and gender are required" });
    }

<<<<<<< HEAD
    const patientData = {
      id: "PAT-" + Math.floor(100000 + Math.random() * 900000),
      name,
      age,
      gender,
      contactNumber: contactNumber || "",
      address: address || "",
      registeredBy: req.userId,
      registeredAt: new Date(),
    };
=======
    const patientId = "PAT-" + Math.floor(100000 + Math.random() * 900000);

    const newPatient = new Patient({
      patientId,
      name,
      age: Number(age),
      gender,
      contactNumber: contactNumber || "",
      address: address || "",
      diagnosis: diagnosis || "Under Observation",
      vitals: vitals || { bp: "120/80 mmHg", pulse: 78, temp: "98.6°F", spo2: "99%" },
      registeredBy: req.userId,
      history: [
        {
          date: new Date(),
          visitType: "Initial Triage & Registration",
          notes: "Registered by clinic receptionist.",
          vitals: "BP: 120/80 mmHg | Temp: 98.6°F",
        },
      ],
    });

    if (Patient.db?.readyState === 1) {
      await newPatient.save();
    }
>>>>>>> moiz

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully by receptionist",
<<<<<<< HEAD
      patient: patientData,
    });
  } catch (error) {
=======
      patient: newPatient,
    });
  } catch (error) {
    console.error("Error in registerPatient:", error);
>>>>>>> moiz
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
<<<<<<< HEAD
    return res.json({
      success: true,
      message: "Patient search results retrieved successfully",
=======

    if (Patient.db?.readyState === 1) {
      const filter = query
        ? {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { patientId: { $regex: query, $options: "i" } },
              { diagnosis: { $regex: query, $options: "i" } },
            ],
          }
        : {};
      const patients = await Patient.find(filter).limit(20);
      return res.json({
        success: true,
        query: query || "all",
        results: patients,
      });
    }

    return res.json({
      success: true,
>>>>>>> moiz
      query: query || "all",
      results: [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePatientInfo = async (req, res) => {
  try {
    const { id } = req.params;
<<<<<<< HEAD
=======

    if (Patient.db?.readyState === 1) {
      const updated = await Patient.findOneAndUpdate(
        { $or: [{ _id: id }, { patientId: id }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) {
        return res.json({
          success: true,
          message: `Patient ${id} info updated successfully`,
          patient: updated,
        });
      }
    }

>>>>>>> moiz
    return res.json({
      success: true,
      message: `Patient ${id} info updated successfully by receptionist`,
      updatedFields: req.body,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
<<<<<<< HEAD
=======

export default {
  registerPatient,
  searchPatients,
  updatePatientInfo,
};
>>>>>>> moiz
