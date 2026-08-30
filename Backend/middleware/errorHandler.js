function notFound(_req, res) {
  return res.status(404).json({ success: false, message: "Route not found" });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    return res
      .status(400)
      .json({
        success: false,
        message: "A record with that value already exists",
      });
  }
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
