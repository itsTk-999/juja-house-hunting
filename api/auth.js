const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const nodemailer = require('nodemailer'); 

router.use(express.json());

// --- 1. UPDATED: Robust Nodemailer Config for Render ---
// We switched to Port 587 (STARTTLS) which is less likely to timeout.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, 
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps avoid some SSL certificate issues in dev/free tier
  },
  // Add timeouts so it doesn't hang forever if it fails
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,    // 5 seconds
  socketTimeout: 10000      // 10 seconds
});

// Verify connection on startup (helps debugging in Render logs)
transporter.verify((error, success) => {
  if (error) {
    console.error("!!! NODEMAILER CONNECTION ERROR !!!", error.message);
  } else {
    console.log(">>> Nodemailer is ready to send emails (Port 587)");
  }
});


// --- POST /api/auth/register (unchanged) ---
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = new User({ name, email, password, role });
    await user.save(); 
    res.status(201).json({ message: "Registration successful. Please log in." });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- POST /api/auth/login (unchanged) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    
    const isMatch = await user.comparePassword(password); 
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
    const payload = { user: { id: user.id, role: user.role } };
    const userObject = user.toObject();
    delete userObject.password;

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
        if (err) throw err;
        res.json({ message: "Login successful", token, user: userObject });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- POST /api/auth/forgot-password (unchanged) ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log(`[Forgot Password] Request received for: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[Forgot Password] User not found: ${email}`);
      return res.json({ message: "If an account with this email exists, a reset link has been sent." });
    }

    const resetToken = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Juja Hunt" <${process.env.EMAIL_USER}>`, 
      to: user.email, 
      subject: `Password Reset Request`, 
      text: `You requested a password reset. Click this link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes.`,
      html: `<p>You requested a password reset. Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>` // Added HTML body for better compatibility
    };

    console.log("[Forgot Password] Attempting to send email...");
    // Await the email sending promise
    const info = await transporter.sendMail(mailOptions);
    console.log("[Forgot Password] Email sent successfully! Message ID:", info.messageId);
    
    res.json({ message: "If an account with this email exists, a reset link has been sent." });

  } catch (err) {
    console.error("!!! PASSWORD RESET ERROR !!!", err); // THIS WILL NOW SHOW THE EXACT ERROR
    // Send a generic 500 error so the frontend doesn't get a JSON parse error
    res.status(500).json({ message: "Server error sending email. Please try again later." });
  }
});

// --- POST /api/auth/reset-password/:token (unchanged) ---
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!password || password.length < 8) {
             return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.findByIdAndUpdate(
            decoded.user.id,
            { $set: { password: hashedPassword } },
            { new: true } 
        );
        if (!user) return res.status(400).json({ message: "Invalid token." });
        
        res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Invalid or expired token." });
        }
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;