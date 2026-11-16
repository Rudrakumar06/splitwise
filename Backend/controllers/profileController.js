const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { asyncHandler, fail, success } = require("../utils/api");

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) fail("User not found", 404);
  return success(res, 200, "Profile retrieved successfully", user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar, notifications } = req.body;
  if (name !== undefined && (typeof name !== "string" || !name.trim()))
    fail("Name cannot be empty");
  if (phone !== undefined && typeof phone !== "string")
    fail("Phone must be a string");
  if (bio !== undefined && typeof bio !== "string")
    fail("Bio must be a string");
  if (bio !== undefined && bio.length > 200)
    fail("Bio must be at most 200 characters");
  if (avatar !== undefined && typeof avatar !== "string")
    fail("Avatar must be a string");

  const user = await User.findById(req.user._id);
  if (!user) fail("User not found", 404);

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (notifications && typeof notifications === "object") {
    if (notifications.email !== undefined)
      user.notifications.email = Boolean(notifications.email);
    if (notifications.push !== undefined)
      user.notifications.push = Boolean(notifications.push);
    if (notifications.expenseAdded !== undefined)
      user.notifications.expenseAdded = Boolean(notifications.expenseAdded);
    if (notifications.settlementRecorded !== undefined)
      user.notifications.settlementRecorded = Boolean(
        notifications.settlementRecorded,
      );
    if (notifications.memberJoined !== undefined)
      user.notifications.memberJoined = Boolean(notifications.memberJoined);
  }

  await user.save();
  return success(
    res,
    200,
    "Profile updated successfully",
    await User.findById(user._id).select("-password"),
  );
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  )
    fail("Current password and new password are required");
  if (newPassword.length < 6)
    fail("New password must be at least 6 characters");

  const user = await User.findById(req.user._id);
  if (!user) fail("User not found", 404);
  if (!(await bcrypt.compare(currentPassword, user.password)))
    fail("Current password is incorrect", 401);

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return success(res, 200, "Password changed successfully", null);
});