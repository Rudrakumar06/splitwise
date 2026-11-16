const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 200 },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      expenseAdded: { type: Boolean, default: true },
      settlementRecorded: { type: Boolean, default: true },
      memberJoined: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
