const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const UserModel = require("../Models/UserModel");
// const UserModel = require("../Models/userModel");
const {
  generatePasswordUpdateTemplate,
  generateEmailTemplate,
  generateWelcomeTemplate,
} = require("../EmailTemplate");

// POST /auth/request-reset
const request_reset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP and set its expiry (e.g., 10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Save OTP and expiry to user document
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: generateEmailTemplate(otp),
    });

    res.status(200).json({ message: "OTP sent to your email", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error requesting OTP", error, success: false });
  }
};

const verify_otp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is valid and not expired
    if (user.resetOtp !== Number(otp) || Date.now() > user.resetOtpExpiry) {
      return res
        .status(400)
        .json({ message: "Invalid or expired OTP", success: false });
    }

    // Hash new password and save it
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined; // Clear OTP fields
    user.resetOtpExpiry = undefined;
    await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Successful",
      html: generatePasswordUpdateTemplate(),
    });

    res
      .status(200)
      .json({ message: "Password reset successful", success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error, success: false });
  }
};
const send_welcome_email = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to MemoryyMap!",
      html: generateWelcomeTemplate(name),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

const signin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({
      email: email,
    });
    if (user) {
      return res
        .status(409)
        .json({ message: "user already exist , you can login", sucess: false });
    }
    const userModel = new UserModel({ name, email, password });
    userModel.password = await bcrypt.hash(password, 10);
    await userModel.save();
    res
      .status(201)
      .json({ message: "user created successfully", sucess: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", sucess: false });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({
      email: email,
    });
    if (!user) {
      return res.status(403).json({ message: "No User Found", sucess: false });
    }

    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res
        .status(403)
        .json({ message: "Incorrect Password", sucess: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "10s",
      }
    );

    res.status(201).json({
      message: "Logged in successfully",
      sucess: true,
      jwtToken,
      email,
      name: user.name,
      _id: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", sucess: false });
  }
};

module.exports = {
  signin,
  login,
  request_reset,
  verify_otp,
  send_welcome_email,
};
