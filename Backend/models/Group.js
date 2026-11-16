const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Speeds up "find all groups for this user" and "find groups created by this user".
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);
