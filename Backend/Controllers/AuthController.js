//Impoting Packages
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
//Importing files
import User from '../Models/User.js'
import transporter from '../Config/nodemailer.js';



export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required", success: false });
    }

    // Check existing user
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists", success: false });
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // Save user
    const user = new User({ username, email, password: hashedPass });
    await user.save();

    // JWT
    if (!process.env.JWT_SECRET || !process.env.COOKIE_NAME || !process.env.SENDER_EMAIL) {
      console.error("Missing required env vars");
      return res.status(500).json({ message: "Server misconfiguration", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Cookie
    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // must be true if sameSite is none
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send email
    // console.log(transporter.host)

      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome To Our Website",
        text: `Welcome to our website ${username}. Your account registered with ${email}`,
      }
      await transporter.sendMail(mailOptions);
  
    

    // Success
    res.status(201).json({ message: "User registered successfully", success: true });
  } catch (err) {
    console.error("Error in register:", err);
    res.status(500).json({ message: "Server error", success: false });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Cookie
    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // must be true if sameSite is none
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const logout = (req,res)=>{
    res.clearCookie(process.env.COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // must be true if sameSite is none
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  res.json({ success: true, message: "Logged out successfully" });
}


export const sendVerifyOtp = async (req, res) => {
  try {
    // userId now comes from middleware, not body
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Already Verified" });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email, // use user.email instead of undefined
      subject: "Supportio Account OTP",
      text: `Your OTP is ${otp}. Verify your Supportio account.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Verification OTP sent" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const verifyEmail = async(req,res)=>{
    const {userId, otp} = req.body

    if(!userId || !otp){
      return res.json({success:false, message:"Missing Details"})
    }

    try{

      const user = await User.findById(userId)

      if(!user){
        return res.json({success:false,message:"User not found"})
      }

      if(user.verifyOtp === '' || user.verifyOtp !== otp){
        return res.json({success:false,message:"Invalid OTP"})
      }

      if(user.verifyOtpExpireAt < Date.now()){
        return res.json({success:false,message:"OTP Expired"})
      }

      user.isAccountVerified = true
      user.verifyOtp=''
      user.verifyOtpExpireAt = 0

      await user.save()

    
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email, // use user.email instead of undefined
      subject: "Your Supportio Account Was Verified",
      text: `Congrtulations ${user.name}. Your Supportio Account Was verified.`,
    };

    await transporter.sendMail(mailOptions);


      return res.json({success:true,message:'email verified '})

    }catch(error){
       res.json({success:false,message:error.message})
    }
}

export const isAuthenticated = async(req,res)=>{
  try{
    return res.json({success:true})
  }catch(error){
    res.json({success:false,message:error.message})
  }
}

export const sendResetOtp = async(req,res)=>{
  const {email} = req.body
  if(!email){
    return res.json({success:false, message:"Email is required"})
  }

  try {
    const user = await User.findOne({email})

    if(!user){
      return res.json({success:false,message:"User Not Found"})
    }
    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 24h

    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email, // use user.email instead of undefined
      subject: "Supportio Password Reset Otp",
      text: `Your OTP is ${otp}. Reset your Supportio password.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({success:true,message:"Reset Otp sent"})

  } catch (error) {
    
  }
}

export const resetPassword = async(req,res)=>{
  const {email,otp,newPassword} = req.body

  if(!email || !otp || !newPassword){
    return res.json({success:false,message:"All fields are requiredS"})
  }

  try {
    const user = await User.findOne({email})

    if(!user){
      return res.json({success:false,message:"User Not found"})
    }

    if(user.resetOtp === "" || user.resetOtp !== otp){
      return res.json({success:false,message:"Invalid or expired Otp"})
    }

    if(user.resetOtpExpireAt < Date.now()){
      return res.json({success:true,message:"Invalid or expired otp"})
    }

    const hashedPass = await bcrypt.hash(newPassword,10)
    user.password = hashedPass
    user.resetOtp = ''
    user.resetOtpExpireAt = 0

    await user.save()

    return res.status(200).json({success:true,message:"Pass reset"})
  } catch (error) {
    return res.json({success:false,message:error.message})
  }
}

export const getUserData = async(req,res)=>{
  try {
    const userId = req.userId

    const user = await User.findById(userId)
    if(!user){
      return res.json({success:false,message:"User Not exist"})
    }

    res.json({
      success:true,
      userData:{
        name:user.username,
        isAccountVerified:user.isAccountVerified
      }
    })
  } catch (error) {
    return res.json({success:false,message:error.message})
  }
}