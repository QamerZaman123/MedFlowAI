import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // no duplicate usernames
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // no duplicate emails
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"], // regex validation
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // at least 6 characters
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist"],
      default: "admin",
      required: true,
    },
    verifyOtp:{
      type:String,
      default:''
    },
    verifyOtpExpireAt:{
      type:Number,
      default:0
    },
    isAccountVerified:{
      type:Boolean,
      default:false
    },
    resetOtp:{
      type:String,
      default:''
    },
    resetOtpExpireAt:{
      type:Number,
      default:0
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

const User = mongoose.model("User", userSchema);

export default User;