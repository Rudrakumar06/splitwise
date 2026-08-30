const Group = require("../models/Group");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const { asyncHandler, fail, success } = require("../utils/api");
const { getGroup, validId } = require("../services/groupService");

exports.createGroup = asyncHandler(async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name || !name.trim()) fail("Group name is required");
  const group = await Group.create({
    name: name.trim(),
    description,
    createdBy: req.user._id,
    members: [req.user._id],
  });
  return success(
    res,
    201,
    "Group created successfully",
    await group.populate("members", "name email"),
  );
});

exports.getGroups = asyncHandler(async (req, res) =>
  success(
    res,
    200,
    "Groups retrieved successfully",
    await Group.find({ members: req.user._id })
      .populate("createdBy", "name email")
      .populate("members", "name email"),
  ),
);
exports.getGroupById = asyncHandler(async (req, res) =>
  success(
    res,
    200,
    "Group retrieved successfully",
    await getGroup(req.params.groupId, req.user._id),
  ),
);

exports.updateGroup = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  if (String(group.createdBy._id) !== String(req.user._id))
    fail("Only the group creator can update the group", 403);
  const { name, description } = req.body;
  if (name !== undefined && !name.trim()) fail("Group name cannot be empty");
  if (name !== undefined) group.name = name.trim();
  if (description !== undefined) group.description = description;
  await group.save();
  return success(res, 200, "Group updated successfully", group);
});

exports.deleteGroup = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  if (String(group.createdBy._id) !== String(req.user._id))
    fail("Only the group creator can delete the group", 403);
  await Promise.all([
    Expense.deleteMany({ group: group._id }),
    Settlement.deleteMany({ group: group._id }),
    Group.deleteOne({ _id: group._id }),
  ]);
  return success(
    res,
    200,
    "Group and associated records deleted successfully",
    null,
  );
});
