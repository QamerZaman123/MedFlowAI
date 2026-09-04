// Importing Packages
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// Importing files
import User from '../Models/User.js'
import transporter from '../Config/Nodemailer.js';

export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required", success: false });
    }

    let assignedRole = "admin";
    if (role) {
      if (!["admin", "doctor", "receptionist"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified", success: false });
      }
      assignedRole = role;
    }

    // Check existing user
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists", success: false });
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // Save user with role
    const user = new User({ username, email, password: hashedPass, role: assignedRole });
    await user.save();

    const cookieName = process.env.COOKIE_NAME || "mycookie";
    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";

    // JWT payload includes role
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: "7d" });

    // Cookie
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send email (safely handle if SMTP is unconfigured)
    if (process.env.SENDER_EMAIL) {
      try {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: email,
          subject: "Welcome To MedFlowAI",
          text: `Welcome ${username}. Your account has been registered with role ${user.role}.`,
        };
        await transporter.sendMail(mailOptions);
      } catch (mailError) {
        console.error("Nodemailer error in register:", mailError.message);
      }
    }

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Error in register:", err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: "Invalid email or password" });

    const cookieName = process.env.COOKIE_NAME || "mycookie";
    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";

    // JWT payload includes role
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: "7d" });

    // Cookie
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const logout = (req, res) => {
  const cookieName = process.env.COOKIE_NAME || "mycookie";
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, message: "Logged out successfully" });
};

// Admin endpoint to create doctor, receptionist, or admin accounts
export const createUserByAdmin = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Username, email, password, and role are required" });
    }

    if (!["admin", "doctor", "receptionist"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPass, role });
    await user.save();

    res.status(201).json({
      success: true,
      message: `User created successfully with role ${role}`,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Error in createUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin endpoint to get list of all users
export const getAllUsers = async (req, res) => {
  try {
    if (User.db.readyState !== 1) {
      return res.json({ success: true, users: [], note: "Database offline" });
    }
    const users = await User.find({}).select("-password");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin endpoint to update staff details
export const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    if (username) {
      const trimmedUser = username.trim();
      const existingUser = await User.findOne({ username: trimmedUser, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already taken by another staff member" });
      }
      user.username = trimmedUser;
    }

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: trimmedEmail, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already taken by another staff member" });
      }
      user.email = trimmedEmail;
    }

    if (role) {
      if (!["admin", "doctor", "receptionist"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role specified" });
      }
      user.role = role;
    }

    if (password && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    res.json({
      success: true,
      message: `Staff member ${user.username} updated successfully`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in updateUserByAdmin:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

// Admin endpoint to delete a staff member
export const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent admin from deleting their own account
    if (String(req.userId) === String(id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own active administrative account.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Staff member ${user.username} (${user.email}) successfully deleted.`,
    });
  } catch (err) {
    console.error("Error in deleteUserByAdmin:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Already Verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    if (process.env.SENDER_EMAIL) {
      try {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: user.email,
          subject: "Account OTP",
          text: `Your OTP is ${otp}.`,
        };
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error("Nodemailer error:", mailErr.message);
      }
    }

    return res.json({ success: true, message: "Verification OTP sent" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.verifyOtp === '' || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;

    await user.save();

    if (process.env.SENDER_EMAIL) {
      try {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: user.email,
          subject: "Your Account Was Verified",
          text: `Congratulations ${user.username}. Your Account Was verified.`,
        };
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error("Nodemailer error:", mailErr.message);
      }
    }

    return res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true, role: req.userRole });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    if (process.env.SENDER_EMAIL) {
      try {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: user.email,
          subject: "Password Reset Otp",
          text: `Your OTP is ${otp}. Reset your password.`,
        };
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error("Nodemailer error:", mailErr.message);
      }
    }

    return res.json({ success: true, message: "Reset Otp sent" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User Not found" });
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid or expired Otp" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "Invalid or expired otp" });
    }

    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();

    return res.status(200).json({ success: true, message: "Pass reset" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User Not exist" });
    }

    res.json({
      success: true,
      userData: {
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        isAccountVerified: user.isAccountVerified
      }
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};