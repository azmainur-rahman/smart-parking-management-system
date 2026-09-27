import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

export const transporter = createTransport();

export const sendMail = async ({ to, subject, text, html, attachments }) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || 'Smart Parking <noreply@smartparking.example>',
    to,
    subject,
    text,
    html,
    attachments
  };

  return transporter.sendMail(mailOptions);
};

export default { createTransport, transporter, sendMail };
