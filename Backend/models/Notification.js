const mongoose = require('mongoose');

/**
 * In-app notifications fired for group activity (expense added, settlement
 * recorded, member joined). Each notification is scoped to a single recipient
 * user and optionally a group so it can be filtered by context.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    type: {
      type: String,
      enum: ['expense_added', 'settlement_recorded', 'member_joined'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Fast lookup of a user's notifications, newest first.
notificationSchema.index({ user: 1, createdAt: -1 });
// Fast lookup of unread count per user.
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);