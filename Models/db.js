const mongoose = require("mongoose");
// const Grid = require("gridfs-stream");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const conn = mongoose.connection;

let bucket;

// Wait for connection to open
conn.once("open", () => {
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
  console.log("✅ GridFSBucket initialized");
});

// Export a getter to safely access bucket
const getBucket = () => bucket;

module.exports = { conn, getBucket };
