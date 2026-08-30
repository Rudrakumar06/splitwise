function asyncHandler(handler) {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
}

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function success(res, statusCode, message, data) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = { asyncHandler, fail, success };
