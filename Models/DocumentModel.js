const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    summary: { type: String, default: "" },
    tags: {
      type: [String],
      set: (tags) => tags.map((t) => t.toLowerCase()), // normalize tags
    },
    embedding: {
      type: [Number],
      validate: (v) => !v.length || v.length === 768, // enforce correct dimension
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: { type: String, enum: ["admin", "user"], default: "user" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    versions: [
      {
        title: String,
        content: String, // optional: store content history too
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

const DocumentModel = mongoose.model("Document", documentSchema);

module.exports = DocumentModel;
