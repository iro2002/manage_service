import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const pass = process.env.SMTP_PASS || '';
// Gmail App Passwords work with or without spaces
const cleanPass = pass.replace(/\s/g, '');

console.log('Raw pass length:', pass.length);
console.log('Clean pass length:', cleanPass.length);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: cleanPass,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP verify failed:', err.message, '\nCode:', err.code);
    return;
  }
  console.log('✅ SMTP verified — sending test assignment email...');
  transporter.sendMail({
    from: `"Manage Service" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: '[Asset Assignment] Test — HP Elitebook 840',
    html: `
      <div style="font-family:Arial;padding:20px;border:1px solid #e5e7eb;border-radius:8px;max-width:500px">
        <h2 style="color:#4f46e5">Laptop Assigned ✅</h2>
        <p>This is a test of the assignment email system.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px">
          <tr><td style="padding:8px;color:#6b7280">Employee</td><td style="padding:8px;font-weight:600">Test User</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Model</td><td style="padding:8px;font-weight:600">HP Elitebook 840 G3</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Serial No</td><td style="padding:8px;font-family:monospace">SB2455324</td></tr>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#9ca3af">This confirms the email service is working.</p>
      </div>
    `,
  }, (sendErr, info) => {
    if (sendErr) {
      console.error('❌ Send failed:', sendErr.message);
    } else {
      console.log('✅ Email sent! ID:', info.messageId);
      console.log('Check inbox at:', process.env.SMTP_USER);
    }
  });
});
