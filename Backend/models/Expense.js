const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Filled later by the splitting service; supports both calculated and custom shares.
    shareAmount: { type: Number, default: null },
    // How much of this participant's share has already been settled. The amount
    // still owed is shareAmount - settledAmount.
    settledAmount: { type: Number, default: 0 },
    // Indicates whether shareAmount was explicitly supplied or calculated later.
    isCustomAmount: { type: Boolean, default: false },
  },
  { _id: false }
);

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Groceries',
  'Utilities',
  'Entertainment',
  'Travel',
  'Healthcare',
  'Rent',
  'Shopping',
  'Education',
  'Gifts',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    description: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: { type: String, enum: ['EQUAL', 'CUSTOM'], required: true },
    participants: { type: [participantSchema], default: [] },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'Other',
    },
    receiptImage: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Speeds up expense queries scoped to a group, ordered by newest first.
expenseSchema.index({ group: 1, createdAt: -1 });
// Speeds up "expenses paid by this user" lookups.
expenseSchema.index({ paidBy: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
