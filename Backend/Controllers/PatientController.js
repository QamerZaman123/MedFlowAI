export const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, contactNumber, address } = req.body;
    if (!name || !age || !gender) {
      return res.status(400).json({ success: false, message: "Patient name, age, and gender are required" });
    }

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

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully by receptionist",
      patient: patientData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    return res.json({
      success: true,
      message: "Patient search results retrieved successfully",
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
    return res.json({
      success: true,
      message: `Patient ${id} info updated successfully by receptionist`,
      updatedFields: req.body,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
