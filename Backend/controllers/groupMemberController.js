const User = require("../models/User");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const { asyncHandler, fail, success } = require("../utils/api");
const { getGroup, validId } = require("../services/groupService");

exports.addMember = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const email = req.body.email;
  if (typeof email !== "string" || !email.trim())
    fail("Member email is required");
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) fail("User with that email does not exist", 404);
  if (group.members.some((member) => String(member._id) === String(user._id)))
    fail("User is already a group member", 409);
  group.members.push(user._id);
  await group.save();
  return success(res, 201, "Member added successfully", user);
});

exports.removeMember = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  if (String(group.createdBy._id) !== String(req.user._id))
    fail("Only the group creator can remove members", 403);
  validId(req.params.userId, "user id");
  if (String(group.createdBy._id) === req.params.userId)
    fail("The group creator cannot be removed", 400);
  if (!group.members.some((member) => String(member._id) === req.params.userId))
    fail("User is not a group member", 404);
  const [hasExpenseData, hasSettlementData] = await Promise.all([
    Expense.exists({
    group: group._id,
    $or: [
      { paidBy: req.params.userId },
      { "participants.user": req.params.userId },
    ],
    }),
    Settlement.exists({
      group: group._id,
      $or: [{ fromUser: req.params.userId }, { toUser: req.params.userId }],
    }),
  ]);
  if (hasExpenseData || hasSettlementData)
    fail(
      "Cannot remove a member referenced by existing expenses or settlements",
      400,
    );
  group.members = group.members.filter(
    (member) => String(member._id) !== req.params.userId,
  );
  await group.save();
  return success(res, 200, "Member removed successfully", null);
});

exports.getMembers = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  return success(res, 200, "Members retrieved successfully", group.members);
});
