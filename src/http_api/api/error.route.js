/**
 * Handles API requests and throws an error.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    throw new Error('Something went wrong');
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
