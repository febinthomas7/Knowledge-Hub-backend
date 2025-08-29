const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const albumSchema = new Schema(
  {
    title: { type: String, required: true }, // e.g. "Goa Trip", "College Days"

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Memory" }], // all related memories
  },
  { timestamps: true }
);
const AlbumModel = mongoose.model("Album", albumSchema);

module.exports = AlbumModel;
