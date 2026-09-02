const Expense = require("../models/Expense");
const { asyncHandler, fail, success } = require("../utils/api");
const { calculateShares } = require("../services/splitService");
const { getGroup, validId } = require("../services/groupService");

function memberIds(group) {
  return new Set(group.members.map((member) => String(member._id)));
}

function expensePayload(body, group, userId, existing = {}) {
  const totalAmount =
    body.totalAmount === undefined ? existing.totalAmount : body.totalAmount;
  const paidBy = body.paidBy === undefined ? existing.paidBy : body.paidBy;
  const splitType =
    body.splitType === undefined ? existing.splitType : body.splitType;
  const participants =
    body.participants === undefined
      ? existing.participants.map((item) => item.user)
      : body.participants;
  // Switching to an equal split must discard any previously saved custom shares.
  const customAmounts =
    splitType === "EQUAL"
      ? []
      : body.customAmounts === undefined
      ? existing.participants
          .filter((item) => item.isCustomAmount)
          .map((item) => ({ user: item.user, amount: item.shareAmount }))
      : body.customAmounts;
  const ids = memberIds(group);
  if (!ids.has(String(paidBy))) fail("The payer must be a group member");
  if (!Array.isArray(participants) || participants.length === 0)
    fail("At least one participant is required");
  if (new Set(participants.map(String)).size !== participants.length)
    fail("Participants cannot contain duplicates");
  if (participants.some((participant) => !ids.has(String(participant))))
    fail("Every participant must be a group member");
  const shares = calculateShares(
    totalAmount,
    participants,
    splitType,
    customAmounts,
  );
  return {
    totalAmount,
    paidBy,
    splitType,
    participants: shares,
    description:
      body.description === undefined ? existing.description : body.description,
    createdBy: existing.createdBy || userId,
  };
}

exports.createExpense = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  if (
    typeof req.body.description !== "string" ||
    !req.body.description.trim()
  )
    fail("Expense description is required");
  const expense = await Expense.create({
    group: group._id,
    ...expensePayload(req.body, group, req.user._id),
  });
  return success(
    res,
    201,
    "Expense created successfully",
    await expense.populate([
      { path: "paidBy", select: "name email" },
      { path: "participants.user", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]),
  );
});

exports.getExpenses = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const expenses = await Expense.find({ group: group._id })
    .populate("paidBy", "name email")
    .populate("participants.user", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
  return success(res, 200, "Expenses retrieved successfully", expenses);
});

exports.getExpenseById = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  validId(req.params.expenseId, "expense id");
  const expense = await Expense.findOne({
    _id: req.params.expenseId,
    group: group._id,
  })
    .populate("paidBy", "name email")
    .populate("participants.user", "name email")
    .populate("createdBy", "name email");
  if (!expense) fail("Expense not found", 404);
  return success(res, 200, "Expense retrieved successfully", expense);
});

async function findAuthorizedExpense(req) {
  const group = await getGroup(req.params.groupId, req.user._id);
  validId(req.params.expenseId, "expense id");
  const expense = await Expense.findOne({
    _id: req.params.expenseId,
    group: group._id,
  });
  if (!expense) fail("Expense not found", 404);
  if (
    String(expense.createdBy) !== String(req.user._id) &&
    String(group.createdBy._id) !== String(req.user._id)
  )
    fail("You are not allowed to modify this expense", 403);
  return { group, expense };
}

exports.updateExpense = asyncHandler(async (req, res) => {
  const { group, expense } = await findAuthorizedExpense(req);
  const payload = expensePayload(req.body, group, req.user._id, expense);
  if (typeof payload.description !== "string" || !payload.description.trim())
    fail("Expense description is required");
  payload.description = payload.description.trim();
  Object.assign(expense, payload);
  await expense.save();
  return success(res, 200, "Expense updated successfully", expense);
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const { expense } = await findAuthorizedExpense(req);
  await expense.deleteOne();
  return success(res, 200, "Expense deleted successfully", null);
});
