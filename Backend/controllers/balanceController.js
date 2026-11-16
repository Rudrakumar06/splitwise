const { asyncHandler, success } = require("../utils/api");
const { getGroup } = require("../services/groupService");
const { getGroupBalances } = require("../services/balanceService");

exports.getGroupBalances = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  return success(
    res,
    200,
    "Balances retrieved successfully",
    await getGroupBalances(group),
  );
});
