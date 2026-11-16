const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const profileRoutes = require("./routes/profileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(cors());
app.use(express.json());

// Auth endpoints get a strict limit to block brute-force / credential stuffing.
app.use("/api/auth", authLimiter, authRoutes);
// All other API routes share a general limit.
app.use("/api/profile", apiLimiter, profileRoutes);
app.use("/api/upload", apiLimiter, uploadRoutes);
app.use("/api/groups", apiLimiter, groupRoutes);
app.use("/api/notifications", apiLimiter, notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
