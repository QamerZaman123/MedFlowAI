import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const token = req.cookies?.mycookie; // get cookie
  console.log(token)

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Login Required" });
    }

    // Attach userId safely to req (better than req.body)
    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default userAuth;