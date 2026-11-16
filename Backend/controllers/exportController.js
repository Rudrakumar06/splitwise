const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const { asyncHandler, fail, success, csvCell, csvRow } = require("../utils/api");
const { getGroup } = require("../services/groupService");
const { calculateBalances } = require("../services/balanceService");

exports.exportGroupData = asyncHandler(async (req, res) => {
  const group = await getGroup(req.params.groupId, req.user._id);
  const format = req.query.format || "json";

  const [expenses, settlements, balances] = await Promise.all([
    Expense.find({ group: group._id })
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 }),
    Settlement.find({ group: group._id })
      .populate("fromUser", "name email")
      .populate("toUser", "name email")
      .sort({ createdAt: -1 }),
    calculateBalances(group),
  ]);

  if (format === "csv") {
    let csv = "";
    csv += csvRow(["Group Name", group.name]);
    csv += csvRow(["Group Description", group.description || "N/A"]);
    csv += "\n";

    csv += csvRow(["EXPENSES"]);
    csv += csvRow(["Description", "Category", "Total Amount", "Paid By", "Split Type", "Date"]);
    expenses.forEach((e) => {
      csv += csvRow([
        e.description,
        e.category || "Other",
        e.totalAmount,
        e.paidBy?.name || "Unknown",
        e.splitType,
        e.createdAt,
      ]);
    });

    csv += "\n";
    csv += csvRow(["SETTLEMENTS"]);
    csv += csvRow(["From User", "To User", "Amount", "Date"]);
    settlements.forEach((s) => {
      csv += csvRow([
        s.fromUser?.name || "Unknown",
        s.toUser?.name || "Unknown",
        s.amount,
        s.createdAt,
      ]);
    });

    csv += "\n";
    csv += csvRow(["CURRENT BALANCES"]);
    csv += csvRow(["User Name", "Email", "Balance"]);
    balances.forEach((b) => {
      csv += csvRow([
        b.user?.name || "Unknown",
        b.user?.email || "N/A",
        b.balance,
      ]);
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=group-${group.name.replace(/\s+/g, "_")}-report.csv`,
    );
    return res.status(200).send(csv);
  }

  return success(res, 200, "Group data exported successfully", {
    group: {
      id: group._id,
      name: group.name,
      description: group.description,
      members: group.members,
    },
    expenses,
    settlements,
    balances,
  });
});