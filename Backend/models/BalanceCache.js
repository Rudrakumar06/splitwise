const mongoose = require('mongoose');

/**
 * Cached copy of a group's balances, recomputed on demand and invalidated
 * whenever an expense or settlement is written. Avoids re-scanning every
 * expense on each GET /groups/:id/balances call.
 */
const balanceCacheSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BalanceCache', balanceCacheSchema);