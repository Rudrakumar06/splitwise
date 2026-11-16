const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const BalanceCache = require("../models/BalanceCache");
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
      money(
        (balances.get(String(settlement.toUser)) || 0) - settlement.amount,
      ),
    );
  }
  return group.members.map((member) => ({
    user: member,
    balance: money(balances.get(String(member._id)) || 0),
  }));
}

/**
 * Returns the cached balances for a group, computing and storing them if the
 * cache is empty or stale. Cache is invalidated (deleted) on every write.
 */
async function getGroupBalances(group) {
  const cached = await BalanceCache.findOne({ group: group._id }).lean();
  if (cached) return cached.data;

  const data = await calculateBalances(group);
  await BalanceCache.updateOne(
    { group: group._id },
    { $set: { data } },
    { upsert: true },
  );
  return data;
}

/**
 * Invalidates the cached balances for a group. Call after any expense or
 * settlement write so the next read recomputes from the source of truth.
 */
async function invalidateGroupBalances(groupId) {
  await BalanceCache.deleteOne({ group: groupId });
}

module.exports = { calculateBalances, getGroupBalances, invalidateGroupBalances };