require("dotenv").config();

const express = require("express");
require("./Models/db");
const cors = require("cors");

const AuthRouter = require("./Routes/AuthRouter");
const UserRouter = require("./Routes/UserRouter");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGINS, // Or your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
});
