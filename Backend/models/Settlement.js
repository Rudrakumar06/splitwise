const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    // The specific expense this settlement is paying off. Optional for backwards
    // compatibility with settlements recorded before this field existed.
    expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Speeds up settlement queries scoped to a group, ordered by newest first.
settlementSchema.index({ group: 1, createdAt: -1 });
settlementSchema.index({ expense: 1 });

module.exports = mongoose.model('Settlement', settlementSchema);
