const { body, validationResult } = require('express-validator');

const validateEmail = body('email').isEmail().normalizeEmail();
const validatePassword = body('password').isLength({ min: 6 });
const validateName = body('name').trim().notEmpty();
const validatePhone = body('phone').isMobilePhone();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  handleValidationErrors
};
