import jwt from "jsonwebtoken";
import User from "../Models/User.js";

const userAuth = async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || "mycookie";
  const token = req.cookies?.[cookieName] || req.cookies?.mycookie;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Login Required" });
    }

    req.userId = decoded.id;

    if (decoded.role) {
      req.userRole = decoded.role;
    } else {
      // Backward compatibility for tokens issued before role was added to payload
      const user = await User.findById(decoded.id).select("role");
      req.userRole = user?.role || "receptionist";
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || "Not Authorized" });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied for role: " + req.userRole });
    }

    next();
  };
};

export default userAuth;