/**
 * Validates that required environment variables are present before the server
 * starts. Fails fast with a clear message so a misconfigured deployment never
 * silently serves requests with broken functionality.
 */
function validateEnv() {
  const required = {
    JWT_SECRET: "JWT secret for signing authentication tokens",
    MONGODB_URI: "MongoDB connection string",
  };

  const missing = [];
  for (const [key, description] of Object.entries(required)) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(`${key} (${description})`);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required environment variables:\n  - " + missing.join("\n  - "));
    process.exit(1);
  }

  // JWT secret must be strong enough to resist offline brute-force attacks.
  if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters long.");
    process.exit(1);
  }

  // Warn if running in production with insecure secrets.
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'development-secret') {
      console.error("Production cannot use 'development-secret' as JWT_SECRET.");
      process.exit(1);
    }
  }
}

module.exports = validateEnv;