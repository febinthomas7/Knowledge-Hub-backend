const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const memorySchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    lon: {
      type: Number,
      default: 0,
    },
    lat: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    fileSize: Number,
    originalName: String,
  },
  {
    timestamps: true,
  }
);
const MemoryModel = mongoose.model("Memory", memorySchema);

module.exports = MemoryModel;
