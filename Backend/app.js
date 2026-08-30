const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
