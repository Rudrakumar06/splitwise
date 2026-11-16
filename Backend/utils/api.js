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

/**
 * Sniffs the first bytes of a buffer to determine the real file type.
 * The client-supplied `mimetype` field is untrusted and can be spoofed, so we
 * verify the magic numbers ourselves.
 *
 * Returns the MIME type string for supported image formats, or null if the
 * buffer does not match any known image signature.
 */
function sniffImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // GIF: 47 49 46 (GIF87a / GIF89a)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Safely serializes a value for inclusion in a CSV cell.
 * - Quotes the field and escapes embedded quotes (RFC 4180).
 * - Neutralizes CSV injection: prefixes dangerous leading chars with a single quote.
 *   (Prevents a cell value like =cmd| from executing in Excel/Google Sheets.)
 */
function csvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  const dangerous = /^[=+\-@]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return `"${dangerous ? "'" : ""}${escaped}"`;
}

/**
 * Builds a CSV row string from an array of cell values.
 */
function csvRow(values) {
  return values.map(csvCell).join(",") + "\n";
}

module.exports = { asyncHandler, fail, success, csvCell, csvRow, sniffImageType };
