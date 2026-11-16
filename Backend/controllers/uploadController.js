const multer = require("multer");
const path = require("path");
const { uploadImage } = require("../services/imagekitService");
const { asyncHandler, fail, success, sniffImageType } = require("../utils/api");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

exports.uploadMiddleware = upload.single("image");

exports.uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    fail("No image file provided", 400);
  }

  // Verify the actual file bytes, not the client-supplied mimetype.
  const detectedType = sniffImageType(req.file.buffer);
  if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType)) {
    fail("Uploaded file is not a supported image format", 400);
  }

  try {
    // Name the file by its verified type so the extension matches the content.
    const ext = path.extname(req.file.originalname).toLowerCase() || ".img";
    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const result = await uploadImage(req.file.buffer, fileName, "/receipts");

    return success(res, 200, "Image uploaded successfully", {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl,
    });
  } catch (error) {
    fail(`ImageKit upload failed: ${error.message}`, 500);
  }
});