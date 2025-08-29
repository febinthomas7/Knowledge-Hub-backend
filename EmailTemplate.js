const generatePasswordUpdateTemplate = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Update Successful</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="width: 100%; max-width:300px; background-color: #ffffff; padding: 20px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #dddddd;">
      <h2 style="margin: 0; font-size: 24px; color: #333333;">Password Update Successful</h2>
    </div>
    <div style="padding: 20px; font-size: 16px; color: #333333; line-height: 1.6;">
      <p style="margin-top: 0;">Hello,</p>
      <p>Your password has been updated successfully. You can now log in to your <strong>MemoryyMap</strong> account using your new password.</p>
      <p>If you did not make this change, please contact our support team immediately to secure your account.</p>
      <p>Thank you for keeping your account secure!</p>
      <p>Best regards,<br>MemoryyMap Team</p>
    </div>
  </div>
</body>
</html>

`;

const generateEmailTemplate = (otp) => `
<!DOCTYPE html> 
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - MemoryyMap</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
  <div style="width: 100%; max-width: 300px; background-color: #ffffff; padding: 20px; margin: 40px auto; border-radius: 10px; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);">
    
    <!-- Header -->
    <div style="text-align: center; padding: 15px 0; border-bottom: 2px solid #ff4522;">
      <h2 style="margin: 0; font-size: 22px; color: #ff4522;">MemoryyMap</h2>
      <p style="margin: 5px 0 0; font-size: 14px; color: #555;">Password Reset Request</p>
    </div>

    <!-- Body -->
    <div style="padding: 20px; font-size: 15px; color: #333333; line-height: 1.6;">
      <p style="margin-top: 0;">Hello,</p>
      <p>We received a request to reset your password. Please use the following OTP (One-Time Password) to reset your password. This OTP is valid for the next 10 minutes.</p>
      
      <!-- OTP Box -->
      <div style="display: inline-block; padding: 12px 24px; margin: 20px 0; font-size: 22px; font-weight: bold; color: #ffffff; background-color: #ff4522; border-radius: 6px; letter-spacing: 2px;">
        ${otp}
      </div>
      
      <p>If you didn’t request a password reset, please ignore this email or contact our support team if you have any concerns.</p>
      <p style="margin-bottom: 0;">Best regards,<br><b style="color: #ff4522;">The MemoryyMap Team</b></p>
    </div>
  </div>
</body>
</html>

`;

const generateWelcomeTemplate = (name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MemoryyMap</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
  <div style="max-width: 300px; margin: 20px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
    
    <div style="background-color: #ff4522; color: #fff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Welcome to MemoryyMap!</h1>
    </div>
    
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #ff4522;">Hi ${name},</h2>
      <p style="line-height: 1.6; font-size: 15px; color: #333;">
        We're excited to have you join the <strong style="color:#ff4522;">MemoryyMap</strong> community! 🎉  
        Capture, store, and relive your most cherished memories — all in one place.  
        From your adventures to your everyday moments, MemoryyMap is here to keep them alive forever.
      </p>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${process.env.CORS_ORIGINS}" 
          target="_blank" 
          style="background-color: #ff4522; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
          Start Creating Memories
        </a>
      </div>

      <p style="line-height: 1.6; font-size: 15px; color: #333;">
        If you have any questions or need assistance, our support team is always ready to help.  
        Let’s make your journey unforgettable! ✨
      </p>
      <p style="line-height: 1.6; font-size: 15px; color: #333;">Happy Memory-Making,</p>
      <p style="line-height: 1.6; font-size: 15px; font-weight: bold; color: #ff4522;">- The MemoryyMap Team</p>
    </div>

    <div style="background-color: #f0f0f0; color: #666; text-align: center; padding: 12px 20px; font-size: 13px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} MemoryyMap. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

  `;

module.exports = {
  generatePasswordUpdateTemplate,
  generateEmailTemplate,
  generateWelcomeTemplate,
};
