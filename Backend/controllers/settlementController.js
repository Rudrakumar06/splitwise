const mongoose = require("mongoose");
const Settlement = require("../models/Settlement");
const Expense = require("../models/Expense");
const { asyncHandler, fail, success } = require("../utils/api");
const { getGroup, validId } = require("../services/groupService");
const { money } = require("../services/splitService");
const { invalidateGroupBalances } = require("../services/balanceService");
const { notifySettlementRecorded } = require("../services/notificationService");

async function getUserBalanceInGroup(groupId, userId, session = null) {
  const [expenses, settlements] = await Promise.all([
    Expense.find({ group: groupId }).lean().session(session),
    Settlement.find({ group: groupId }).lean().session(session),
  ]);
  let balance = 0;
  for (const expense of expenses) {
    if (String(expense.paidBy) === String(userId)) {
      balance = money(balance + expense.totalAmount);
    }
    for (const participant of expense.participants) {
      if (String(participant.user) === String(userId)) {
        balance = money(balance - participant.shareAmount);
      }
    }
  }
  for (const settlement of settlements) {
    if (String(settlement.fromUser) === String(userId)) {
      balance = money(balance + settlement.amount);
    }
    if (String(settlement.toUser) === String(userId)) {
      balance = money(balance - settlement.amount);
    }
  }
  return balance;
}

exports.createSettlement = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const { fromUser, toUser, amount, expenseId } = req.body;
  validId(fromUser, "fromUser");
  validId(toUser, "toUser");
  if (expenseId) validId(expenseId, "expenseId");

  if (String(req.user._id) !== String(fromUser))
    fail("You can only record settlements made by yourself", 403);
  if (String(fromUser) === String(toUser))
    fail("fromUser and toUser must be different");
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(roundedAmount) || roundedAmount <= 0)
    fail("Settlement amount must be greater than 0");

  const members = new Set(group.members.map((member) => String(member._id)));
  if (!members.has(String(fromUser)) || !members.has(String(toUser)))
    fail("Both settlement users must be group members");

  const session = await mongoose.startSession();
  let settlement;
  try {
    await session.withTransaction(async () => {
      let expenseDoc = null;
      let participant = null;

      if (expenseId) {
        expenseDoc = await Expense.findOne({
          _id: expenseId,
          group: group._id,
        }).session(session);

        if (!expenseDoc) fail("Expense not found in this group", 404);

        participant = expenseDoc.participants.find(
          (p) => String(p.user) === String(fromUser),
        );
        if (!participant) fail("You are not a participant in this expense", 400);

        const shareAmount = money(participant.shareAmount || 0);
        const settledAmount = money(participant.settledAmount || 0);
        const remainingOwed = money(shareAmount - settledAmount);

        if (remainingOwed <= 0) {
          fail("Your share for this expense is already fully settled", 400);
        }

        if (roundedAmount > remainingOwed) {
          fail(
            `Settlement amount (${money(roundedAmount)}) cannot exceed what you owe on this expense (${money(remainingOwed)}).`,
            400,
          );
        }

        // Update the participant's settled amount
        participant.settledAmount = money(settledAmount + roundedAmount);
        await expenseDoc.save({ session });
      } else {
        // Fallback for general settlements not linked to an expense
        const fromBalance = await getUserBalanceInGroup(group._id, fromUser, session);

        if (fromBalance >= 0) {
          fail(
            "You can only record a settlement when you owe money. Your current balance is settled.",
            400,
          );
        }

        const owedAmount = Math.abs(fromBalance);
        if (roundedAmount > owedAmount) {
          fail(
            `Settlement amount cannot exceed what you owe. You owe ${money(owedAmount)}.`,
            400,
          );
        }
      }

      [settlement] = await Settlement.create(
        [
          {
            group: group._id,
            fromUser,
            toUser,
            amount: roundedAmount,
            expense: expenseId || null,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    await session.endSession();
    throw error;
  }
  await session.endSession();

  // Invalidate the cached balances so the next read recomputes from source.
  await invalidateGroupBalances(group._id);

  const populatedSettlement = await settlement.populate([
    { path: "fromUser", select: "name email" },
    { path: "toUser", select: "name email" },
  ]);
  await notifySettlementRecorded(group, populatedSettlement, req.user._id);

  return success(
    res,
    201,
    "Settlement recorded successfully",
    populatedSettlement,
  );
});

exports.getSettlements = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const settlements = await Settlement.find({ group: group._id })
    .populate("fromUser", "name email")
    .populate("toUser", "name email")
    .populate("expense", "description totalAmount")
    .sort({ createdAt: -1 });
  return success(res, 200, "Settlements retrieved successfully", settlements);
});