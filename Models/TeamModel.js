const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
      },
    ],
    documents: [{ type: Schema.Types.ObjectId, ref: "Document" }], // optional
  },
  { timestamps: true }
);

const TeamModel = mongoose.model("Team", teamSchema);
module.exports = TeamModel;
