const router = require("express").Router();
const {
  signin,
  login,
  request_reset,
  verify_otp,
  send_welcome_email,
} = require("../Controllers/AuthController");

const {
  signinValidation,
  logininValidation,
} = require("../Middlewares/AuthValidation");

router.post("/signin", signinValidation, signin);

router.post("/login", logininValidation, login);
router.post("/request-reset", request_reset);
router.post("/send-welcome-email", send_welcome_email);

router.post("/verify-otp", verify_otp);

module.exports = router;
