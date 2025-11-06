const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const nodemailer = require('nodemailer'); 

router.use(express.json());

// --- Nodemailer Transporter (unchanged) ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: { rejectUnauthorized: false }
});

// --- POST /api/auth/register (CORRECT) ---
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = new User({
      name, email, password, role
    });
    await user.save(); // This correctly triggers the pre-save hook once
    res.status(201).json({ message: "Registration successful. Please log in." });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- POST /api/auth/login (CORRECT) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // This compares the plain-text password from the form
    // with the single-hashed password in the database.
    const isMatch = await user.comparePassword(password); 
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const payload = {
      user: { id: user.id, role: user.role }
    };
    const userObject = user.toObject();
    delete userObject.password;

    jwt.sign(
      payload, process.env.JWT_SECRET, { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: "Login successful", token,
          user: userObject 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- POST /api/auth/forgot-password (CORRECT) ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If an account with this email exists, a reset link has been sent." });
    }
    const resetToken = jwt.sign(
      { user: { id: user.id } }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: `"Juja Home" <${process.env.EMAIL_USER}>`, 
      to: user.email, 
      subject: `Password Reset Request for Juja Home`, 
      text: `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n` +
            `Please click the following link, or paste it into your browser to complete the process:\n\n` +
            `${resetUrl}\n\n` +
            `This link is valid for 15 minutes.\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
    res.json({ message: "If an account with this email exists, a reset link has been sent." });
  } catch (err) {
    console.error('Error in /forgot-password:', err.message);
    res.status(500).json({ message: 'An error occurred on the server. Please try again later.' });
  }
});

// --- POST /api/auth/reset-password/:token (CORRECT) ---
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!password || password.length < 8) {
             return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        // 1. Manually hash the password *once*
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Find the user and update the password directly
        // This command bypasses the 'pre-save' hook, preventing a double hash.
        const user = await User.findByIdAndUpdate(
            decoded.user.id,
            { $set: { password: hashedPassword } },
            { new: true } 
        );
        
        if (!user) {
            return res.status(400).json({ message: "Invalid token or user does not exist." });
        }
        
        res.json({ message: "Password has been reset successfully. You can now log in." });

    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Invalid or expired token. Please try again." });
        }
        console.error("Error in /reset-password:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;