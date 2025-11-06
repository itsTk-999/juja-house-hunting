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
      <p>Hello ${user.name || ""},</p>
      <p>You requested a password reset for your Juja Home account.</p>
      <p>Click the link below to reset your password (valid for 15 minutes):</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await brevoClient.sendTransacEmail({
      sender: { name: "Juja Home", email: "no-reply@jujahousehunt.sbs" },
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
