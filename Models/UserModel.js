const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },
    docs: [{ type: Schema.Types.ObjectId, ref: "doc" }],
    resetOtp: {
      type: Number,
    },
    resetOtpExpiry: {
      type: Number,
    },

    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
