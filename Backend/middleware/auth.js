const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication token required" });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "development-secret",
    );
    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authenticated user not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Invalid or expired authentication token",
      });
  }
}

module.exports = authenticate;
