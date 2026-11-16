const { asyncHandler, fail, success } = require("../utils/api");
const { getGroup } = require("../services/groupService");
const { money } = require("../services/splitService");
const Expense = require("../models/Expense");

/**
 * Returns the expenses in a group where the current user is a participant who
 * still owes money. Each entry includes the payer, the amount owed, and the
 * amount already settled — so the UI can show exactly what is left to pay.
 */
exports.getOwedExpenses = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const userId = String(req.user._id);

  const expenses = await Expense.find({ group: group._id })
    .populate("paidBy", "name email")
    .populate("participants.user", "name email")
    .sort({ createdAt: -1 });

  const owed = [];
  for (const expense of expenses) {
    const participant = expense.participants.find(
      (p) => String(p.user._id) === userId,
    );
    if (!participant) continue;

    const totalShare = money(participant.shareAmount || 0);
    const settled = money(participant.settledAmount || 0);
    const remaining = money(totalShare - settled);
    if (remaining <= 0) continue;

    owed.push({
      _id: expense._id,
      id: expense._id,
      description: expense.description,
      category: expense.category,
      totalAmount: expense.totalAmount,
      paidBy: expense.paidBy,
      splitType: expense.splitType,
      createdAt: expense.createdAt,
      shareAmount: totalShare,
      settledAmount: settled,
      amountOwed: remaining,
    });
  }

  return success(res, 200, "Owed expenses retrieved successfully", owed);
});