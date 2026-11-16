const { asyncHandler, fail, success } = require("../utils/api");
const notificationService = require("../services/notificationService");

exports.getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const unreadOnly = req.query.unread === 'true';
  let notifications = await notificationService.getNotifications(req.user._id, limit);
  if (unreadOnly) {
    notifications = notifications.filter((n) => !n.read);
  }
  return success(res, 200, "Notifications retrieved successfully", notifications);
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.countUnread(req.user._id);
  return success(res, 200, "Unread count retrieved successfully", { unreadCount: count });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (ids !== undefined && (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string'))) {
    fail("ids must be an array of notification ids", 400);
  }
  await notificationService.markRead(req.user._id, ids || null);
  return success(res, 200, "Notifications marked as read", {
    unreadCount: await notificationService.countUnread(req.user._id),
  });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user._id, null);
  return success(res, 200, "All notifications marked as read", {
    unreadCount: await notificationService.countUnread(req.user._id),
  });
});