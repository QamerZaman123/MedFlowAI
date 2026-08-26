import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../Models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI not specified in environment");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin seeding...");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@medflowai.local";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    let existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin account already exists: ${adminEmail}`);
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = new User({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isAccountVerified: true,
    });

    await adminUser.save();
    console.log(`Successfully created Admin user: ${adminUsername} (${adminEmail})`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};

seedAdmin();
