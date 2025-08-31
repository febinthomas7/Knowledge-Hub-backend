const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    title: String,
    content: String,
    summary: String,
    tags: [String],
    embedding: {
      type: [Number], // <-- array of floats
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByRole: { type: String, enum: ["admin", "user"], default: "user" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    versions: [
      {
        title: String,
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

const DocumentModel = mongoose.model("Document", documentSchema);

module.exports = DocumentModel;
