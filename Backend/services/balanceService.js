const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const { money } = require("./splitService");

async function calculateBalances(group) {
  const [expenses, settlements] = await Promise.all([
    Expense.find({ group: group._id }).lean(),
    Settlement.find({ group: group._id }).lean(),
  ]);
  const balances = new Map(
    group.members.map((member) => [String(member._id), 0]),
  );
  for (const expense of expenses) {
    const paid = money(expense.totalAmount);
    balances.set(
      String(expense.paidBy),
      money((balances.get(String(expense.paidBy)) || 0) + paid),
    );
    for (const participant of expense.participants)
      balances.set(
        String(participant.user),
        money(
          (balances.get(String(participant.user)) || 0) -
            participant.shareAmount,
        ),
      );
  }
  for (const settlement of settlements) {
    balances.set(
      String(settlement.fromUser),
      money(
        (balances.get(String(settlement.fromUser)) || 0) + settlement.amount,
      ),
    );
    balances.set(
      String(settlement.toUser),
      money((balances.get(String(settlement.toUser)) || 0) - settlement.amount),
    );
  }
  return group.members.map((member) => ({
    user: member,
    balance: money(balances.get(String(member._id)) || 0),
  }));
}

module.exports = { calculateBalances };
