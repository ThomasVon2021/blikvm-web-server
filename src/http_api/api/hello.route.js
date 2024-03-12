/**
 * Handles the API request and sends a JSON response with a hello world message.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc (req, res, next) {
  try {
    res.json({ msg: 'hello world' });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
