const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates an in-app notification for a single user.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} params.user - recipient
 * @param {string|mongoose.Types.ObjectId} [params.group] - group context
 * @param {string} params.type - 'expense_added' | 'settlement_recorded' | 'member_joined'
 * @param {string} params.title
 * @param {string} params.message
 * @param {object} [params.metadata] - optional extra data (expenseId, settlementId, etc.)
 */
async function createNotification({ user, group, type, title, message, metadata = {} }) {
  if (!user) return null;
  return Notification.create({
    user,
    group: group || null,
    type,
    title,
    message,
    metadata,
  });
}

/**
 * Fetches notifications for a user, newest first, with optional limit.
 */
async function getNotifications(userId, limit = 50) {
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .populate('group', 'name')
    .lean();
}

/**
 * Counts unread notifications for a user.
 */
async function countUnread(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

/**
 * Marks a user's notifications as read. If ids is provided, only those are
 * marked; otherwise all unread notifications for the user are marked.
 */
async function markRead(userId, ids = null) {
  const filter = ids && ids.length
    ? { user: userId, _id: { $in: ids } }
    : { user: userId, read: false };
  return Notification.updateMany(filter, { $set: { read: true } });
}

/**
 * Resolves the list of group members who should be notified for an event,
 * excluding the actor themselves.
 *
 * @param {object} group - populated group with members array
 * @param {string|mongoose.Types.ObjectId} actorId - user who triggered the event
 */
function recipientsForGroup(group, actorId) {
  const actor = String(actorId);
  return (group.members || [])
    .map((m) => (m._id ? m._id : m))
    .filter((id) => String(id) !== actor);
}

/**
 * Fire notifications for a new expense. All group members except the actor
 * receive one, provided their `expenseAdded` preference is enabled.
 */
async function notifyExpenseAdded(group, expense, actorId) {
  const recipients = recipientsForGroup(group, actorId);
  const payerName = expense.paidBy?.name || 'Someone';
  const description = expense.description || 'an expense';
  const amount = expense.totalAmount;

  for (const recipientId of recipients) {
    const user = await User.findById(recipientId).select('notifications').lean();
    if (!user || user.notifications?.expenseAdded === false) continue;

    await createNotification({
      user: recipientId,
      group: group._id,
      type: 'expense_added',
      title: 'New expense added',
      message: `${payerName} added "${description}" for ₹${amount}.`,
      metadata: { expenseId: expense._id },
    });
  }
}

/**
 * Fire notifications for a recorded settlement. The recipient is the person
 * who was paid.
 */
async function notifySettlementRecorded(group, settlement, actorId) {
  const recipientId = String(settlement.toUser?._id || settlement.toUser);
  if (recipientId === String(actorId)) return;

  const user = await User.findById(recipientId).select('notifications').lean();
  if (!user || user.notifications?.settlementRecorded === false) return;

  const actorName = settlement.fromUser?.name || 'Someone';
  const toName = settlement.toUser?.name || 'someone';

  await createNotification({
    user: recipientId,
    group: group._id,
    type: 'settlement_recorded',
    title: 'Settlement recorded',
    message: `${actorName} recorded a settlement of ₹${settlement.amount} to ${toName}.`,
    metadata: { settlementId: settlement._id },
  });
}

/**
 * Fire notifications for a new member joining. All existing members except
 * the actor receive one, provided their `memberJoined` preference is enabled.
 */
async function notifyMemberJoined(group, newMember, actorId) {
  const recipients = recipientsForGroup(group, actorId);

  for (const recipientId of recipients) {
    const user = await User.findById(recipientId).select('notifications').lean();
    if (!user || user.notifications?.memberJoined === false) continue;

    await createNotification({
      user: recipientId,
      group: group._id,
      type: 'member_joined',
      title: 'New member joined',
      message: `${newMember.name} joined the group.`,
      metadata: { userId: newMember._id },
    });
  }
}

module.exports = {
  createNotification,
  getNotifications,
  countUnread,
  markRead,
  notifyExpenseAdded,
  notifySettlementRecorded,
  notifyMemberJoined,
};