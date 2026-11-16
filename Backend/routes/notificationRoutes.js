const router = require('express').Router();
const authenticate = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-read', notificationController.markRead);
router.put('/mark-all-read', notificationController.markAllRead);

module.exports = router;