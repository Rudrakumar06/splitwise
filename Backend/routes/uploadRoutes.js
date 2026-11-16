const router = require("express").Router();
const authenticate = require("../middleware/auth");
const uploadController = require("../controllers/uploadController");

router.use(authenticate);

router.post(
  "/receipt",
  uploadController.uploadMiddleware,
  uploadController.uploadReceipt
);

module.exports = router;