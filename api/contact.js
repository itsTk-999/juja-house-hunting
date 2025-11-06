const express = require('express');
const router = express.Router();
const Brevo = require('@getbrevo/brevo');

router.use(express.json());

// --- Initialize Brevo ---
const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// --- POST /api/contact ---
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const mailData = {
    sender: { name: 'Juja House Hunt', email: 'jujahousehunt@gmail.com' },
    to: [{ email: 'jujahousehunt@gmail.com' }], // your destination email
    subject: `New Contact Message from ${name}`,
    htmlContent: `
  <div style="
    max-width: 600px;
    margin: 0 auto;
    background: #f9fafb;
    border-radius: 10px;
    padding: 20px 30px;
    font-family: 'Poppins', Arial, sans-serif;
    color: #333;
    border: 1px solid #e5e7eb;
  ">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://juja-house-hunting.vercel.app/images/logo.png" alt="Juja House Hunt Logo" 
        style="width: 100px; height: auto; margin-bottom: 10px;" />
      <h2 style="color: #2b2d42; margin: 0;">New Contact Form Message</h2>
    </div>

    <!-- Message Body -->
    <div style="background: #fff; padding: 20px; border-radius: 8px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 10px;">
        <strong style="color: #374151;">From:</strong> ${name}
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 10px;">
        <strong style="color: #374151;">Email:</strong> 
        <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 15px; line-height: 1.8; color: #111827;">
        ${message.replace(/\n/g, '<br>')}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280;">
      <p>© ${new Date().getFullYear()} Juja House Hunt</p>
      <p><a href="https://juja-house-hunting.vercel.app/" style="color: #2563eb; text-decoration: none;">Visit Website</a></p>
    </div>
  </div>
`,
  };

  try {
    await brevo.sendTransacEmail(mailData);
    console.log('✅ Contact email sent successfully');
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
