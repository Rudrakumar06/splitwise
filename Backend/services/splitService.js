const { fail } = require("../utils/api");

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateShares(
  totalAmount,
  participants,
  splitType,
  customAmounts = [],
) {
  const total = money(totalAmount);
  if (!Number.isFinite(total) || total <= 0)
    fail("Total expense must be greater than 0");
  if (!Array.isArray(participants) || participants.length === 0)
    fail("At least one participant is required");

  if (!Array.isArray(customAmounts))
    fail("customAmounts must be an array");

  const customByUser = new Map();
  for (const item of customAmounts) {
    if (!item || !item.user) fail("Each custom amount must include a user");
    if (customByUser.has(String(item.user)))
      fail("Custom amounts cannot contain duplicate users");
    const amount = money(item.amount);
    if (!Number.isFinite(amount) || amount < 0)
      fail("Custom amounts cannot be negative");
    customByUser.set(String(item.user), amount);
  }

  if (splitType === "EQUAL") {
    if (customByUser.size) fail("Equal splits cannot include custom amounts");
    return distribute(
      total,
      participants.map((user) => ({ user, isCustomAmount: false })),
    );
  }
  if (splitType !== "CUSTOM") fail("splitType must be EQUAL or CUSTOM");

  const participantIds = new Set(participants.map(String));
  for (const user of customByUser.keys()) {
    if (!participantIds.has(user))
      fail("Custom amount user must be a participant");
  }
  const customTotal = money(
    [...customByUser.values()].reduce((sum, amount) => sum + amount, 0),
  );
  if (customTotal > total)
    fail("The sum of custom amounts cannot exceed the total expense");

  const remainingUsers = participants.filter(
    (user) => !customByUser.has(String(user)),
  );
  if (!remainingUsers.length && customTotal !== total) {
    fail(
      "Custom amounts must equal the total expense when all participants are specified",
    );
  }
  const calculated = remainingUsers.length
    ? distribute(
        money(total - customTotal),
        remainingUsers.map((user) => ({ user, isCustomAmount: false })),
      )
    : [];
  return participants.map((user) =>
    customByUser.has(String(user))
      ? {
          user,
          shareAmount: customByUser.get(String(user)),
          isCustomAmount: true,
        }
      : calculated.shift(),
  );
}

function distribute(total, entries) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / entries.length);
  let remainder = cents - base * entries.length;
  return entries.map((entry) => ({
    ...entry,
    shareAmount: (base + (remainder-- > 0 ? 1 : 0)) / 100,
  }));
}

module.exports = { money, calculateShares };
