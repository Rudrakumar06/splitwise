const Settlement = require("../models/Settlement");
const { asyncHandler, fail, success } = require("../utils/api");
const { getGroup, validId } = require("../services/groupService");

exports.createSettlement = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const { fromUser, toUser, amount } = req.body;
  validId(fromUser, "fromUser");
  validId(toUser, "toUser");
  if (String(req.user._id) !== String(fromUser))
    fail("You can only record settlements made by yourself", 403);
  if (String(fromUser) === String(toUser))
    fail("fromUser and toUser must be different");
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
    fail("Settlement amount must be greater than 0");
  const members = new Set(group.members.map((member) => String(member._id)));
  if (!members.has(String(fromUser)) || !members.has(String(toUser)))
    fail("Both settlement users must be group members");
  const settlement = await Settlement.create({
    group: group._id,
    fromUser,
    toUser,
    amount: Math.round(Number(amount) * 100) / 100,
  });
  return success(
    res,
    201,
    "Settlement recorded successfully",
    await settlement.populate([
      { path: "fromUser", select: "name email" },
      { path: "toUser", select: "name email" },
    ]),
  );
});

exports.getSettlements = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const settlements = await Settlement.find({ group: group._id })
    .populate("fromUser", "name email")
    .populate("toUser", "name email")
    .sort({ createdAt: -1 });
  return success(res, 200, "Settlements retrieved successfully", settlements);
});
