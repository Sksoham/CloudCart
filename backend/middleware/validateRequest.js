

















const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {


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
