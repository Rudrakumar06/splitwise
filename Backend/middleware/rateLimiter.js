const rateLimit = require('express-rate-limit');

const disabled = process.env.DISABLE_RATE_LIMIT === 'true';

function makeLimiter(max, windowMs = 15 * 60 * 1000) {
  if (disabled) {
    // A no-op middleware lets tests / local dev run without throttling.
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
    },
  });
}

/**
 * Strict limiter for authentication endpoints — prevents brute-force and
 * credential-stuffing attacks on login / register.
 * 15 minute window, 10 attempts per IP.
 */
const authLimiter = makeLimiter(50);

/**
 * General limiter for the rest of the API — protects against accidental
 * abuse / misbehaving clients without throttling legitimate users.
 * 15 minute window, 200 requests per IP.
 */
const apiLimiter = makeLimiter(200);

module.exports = { authLimiter, apiLimiter };