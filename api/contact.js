const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer'); 

// --- ADD: Apply JSON parsing locally ---
router.use(express.json());

// --- Nodemailer Configuration (unchanged) ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: { rejectUnauthorized: false }
});

// --- POST /api/contact ---
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const mailOptions = {
      from: `"Juja Home Contact" <${process.env.EMAIL_USER}>`, 
      to: process.env.EMAIL_USER, 
      subject: `New Contact Form Submission from ${name}`, 
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, 
      html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message:</p><p>${message.replace(/\n/g, '<br>')}</p>`, 
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(200).json({ message: "Message received successfully. We will get back to you soon!" });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: "Failed to send message due to a server error." });
  }
});

module.exports = router;