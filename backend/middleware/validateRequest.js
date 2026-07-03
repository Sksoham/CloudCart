// middleware/validateRequest.js
// Runs after express-validator validation chains in route definitions.
// Collects any validation errors and converts them into a clean,
// client-friendly 400 response via the central ApiError flow.
//
// Usage example (in a routes file):
//   const { body } = require('express-validator');
//   router.post(
//     '/register',
//     [
//       body('name').trim().notEmpty().withMessage('Name is required'),
//       body('email').isEmail().withMessage('Valid email is required'),
//       body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//     ],
//     validateRequest,
//     registerUser
//   );

const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Flatten express-validator errors into a single readable message string,
    // while also returning the structured array for frontend field-level display.
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const error = new ApiError(
      formattedErrors.map((e) => e.message).join(', '),
      400
    );
    error.fields = formattedErrors;
    return next(error);
  }

  next();
};

module.exports = validateRequest;
