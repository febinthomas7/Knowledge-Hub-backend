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
    bio: { type: String, trim: true },

    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String, // URL for profile picture
    },
    publicId: {
      type: String,
      trim: true,
    },
    resetOtp: {
      type: Number,
    },
    resetOtpExpiry: {
      type: Number,
    },
    memories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Memory",
      },
    ],

    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  },
  { timestamps: true }
);
const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
