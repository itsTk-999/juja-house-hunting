const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");
const User = require("../models/User");

router.use(express.json());

// --- Initialize Brevo API ---
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// --- REGISTER ---
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = new User({ name, email, password, role });
    await user.save();
    res
      .status(201)
      .json({ message: "Registration successful. Please log in." });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = { user: { id: user.id, role: user.role } };
    const userObject = user.toObject();
    delete userObject.password;

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" }, (err, token) => {
      if (err) throw err;
      res.json({ message: "Login successful", token, user: userObject });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// --- FORGOT PASSWORD (uses Brevo API) ---
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "If an account with this email exists, a reset link has been sent.",
      });
    }

    const resetToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetUrl = `https://${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const htmlContent = `
  <div style="font-family: Arial, sans-serif; background-color: #f7f8fa; padding: 40px; text-align: center;">
    <div style="max-width: 520px; background: #ffffff; margin: 0 auto; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 30px;">
      
      <img src="https://juja-house-hunting.vercel.app/images/logo.png" alt="Juja House Hunt Logo" style="width: 120px; margin-bottom: 20px;">
      
      <h2 style="color: #2c3e50; margin-bottom: 10px;">Password Reset Request</h2>
      
      <p style="color: #555; line-height: 1.6;">
        Hi <strong>${user.name || ''}</strong>,<br><br>
        We received a request to reset your password for your 
        <strong>Juja House Hunt</strong> account.
      </p>
      
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #007bff; color: #ffffff; 
                text-decoration: none; padding: 12px 25px; border-radius: 6px; 
                font-weight: bold; margin: 20px 0; font-size: 16px;">
        Reset Password
      </a>
      
      <p style="color: #999; font-size: 13px; margin-top: 20px;">
        If you didn’t request this, you can safely ignore this email.<br>
        This link will expire in <strong>15 minutes</strong>.
      </p>
      
      <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #aaa; font-size: 12px;">
        © ${new Date().getFullYear()} Juja House Hunt. All rights reserved.<br>
        <a href="https://jujahousehunt.sbs" style="color: #007bff; text-decoration: none;">Visit our website</a>
      </p>
    </div>
  </div>
`;


    await brevoClient.sendTransacEmail({
      sender: { name: "Juja Home", email: "jujahousehunt@gmail.com" },
      to: [{ email }],
      subject: "Password Reset Request - Juja Home",
      htmlContent,
    });

    console.log("✅ Password reset email sent via Brevo:", email);

    res.json({
      message: "If an account with this email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("❌ PASSWORD RESET ERROR:", err);
    res.status(500).json({ message: "Server error sending reset email" });
  }
});

// --- RESET PASSWORD ---
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(
      decoded.user.id,
      { $set: { password: hashedPassword } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: "Invalid token." });

    res.json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
