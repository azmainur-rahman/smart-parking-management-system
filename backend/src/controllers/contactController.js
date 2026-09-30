import { validationResult } from 'express-validator';
import ContactMessage from '../models/ContactMessage.js';

// @desc    Submit public contact message
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, email, phone, subject, message } = req.body;

  try {
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      subject,
      message
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out. Your message has been received.',
      data: contactMessage
    });
  } catch (error) {
    console.error('[Contact Controller] submitContactMessage error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error saving contact message.'
    });
  }
};

export default {
  submitContactMessage
};
