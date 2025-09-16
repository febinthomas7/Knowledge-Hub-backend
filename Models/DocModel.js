const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const docSchema = new Schema({
  filename: { type: String, required: true }, // original file name
  gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file _id
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // user id or username
  uploadedAt: { type: Date, default: Date.now },
  fileType: { type: String }, // e.g., 'docx'
});

const DocModel = mongoose.model("doc", docSchema);
module.exports = DocModel;
