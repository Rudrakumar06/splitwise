const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Filled later by the splitting service; supports both calculated and custom shares.
    shareAmount: { type: Number, default: null },
    // Indicates whether shareAmount was explicitly supplied or calculated later.
    isCustomAmount: { type: Boolean, default: false },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    description: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: { type: String, enum: ['EQUAL', 'CUSTOM'], required: true },
    participants: { type: [participantSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
