import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

<<<<<<< HEAD
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

=======
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("⚠️ MongoDB connection warning:", err.message);
  }
>>>>>>> moiz
};

export default connectDB;