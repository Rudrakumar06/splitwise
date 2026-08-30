const mongoose = require("mongoose");
const Group = require("../models/Group");
const { fail } = require("../utils/api");

function validId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) fail(`Invalid ${label}`, 400);
  return id;
}

async function getGroup(groupId, userId, requireMember = true) {
  validId(groupId, "group id");
  const group = await Group.findById(groupId)
    .populate("members", "name email")
    .populate("createdBy", "name email");
  if (!group) fail("Group not found", 404);
  if (
    requireMember &&
    !group.members.some((member) => String(member._id) === String(userId))
  )
    fail("You must be a group member", 403);
  return group;
}

module.exports = { validId, getGroup };
