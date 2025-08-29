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

    resetOtp: {
      type: Number,
    },
    resetOtpExpiry: {
      type: Number,
    },

    // 👇 Add role field here
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user", // new users will always be "user" unless changed manually
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
