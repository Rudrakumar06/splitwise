const { asyncHandler, success } = require("../utils/api");
const { getGroup } = require("../services/groupService");
const { calculateBalances } = require("../services/balanceService");

exports.getGroupBalances = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  return success(
    res,
    200,
    "Balances calculated successfully",
    await calculateBalances(group),
  );
});
