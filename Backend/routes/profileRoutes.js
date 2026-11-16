const router = require("express").Router();
const authenticate = require("../middleware/auth");
const profileController = require("../controllers/profileController");

router.use(authenticate);

router.get("/", profileController.getProfile);
router.put("/", profileController.updateProfile);
router.put("/password", profileController.changePassword);

module.exports = router;