const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler, fail, success } = require("../utils/api");

function tokenFor(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" },
  );
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  )
    fail("Name, email, and password are required");
  if (password.length < 6) fail("Password must be at least 6 characters");
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    fail("Email is already registered", 409);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
  });
  return success(res, 201, "User registered successfully", {
    user: { id: user._id, name: user.name, email: user.email },
    token: tokenFor(user),
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  )
    fail("Email and password are required");
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password)))
    fail("Invalid email or password", 401);
  return success(res, 200, "Login successful", {
    user: { id: user._id, name: user.name, email: user.email },
    token: tokenFor(user),
  });
});
