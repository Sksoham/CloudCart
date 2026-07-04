const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for the given user id and role.
 * @param {string} id - MongoDB ObjectId of the user
 * @param {string} role - 'user' | 'admin'
 * @returns {string} signed JWT
 */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generates a JWT for the given user, sets it as an httpOnly cookie on the
 * response, and sends back a JSON payload containing the safe user fields
 * and the token (useful for clients storing the token in localStorage too).
 *
 * @param {Document} user - Mongoose user document
 * @param {number} statusCode - HTTP status code to respond with
 * @param {Response} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // prevents client-side JS from reading the cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
};

module.exports = { signToken, sendTokenResponse };
