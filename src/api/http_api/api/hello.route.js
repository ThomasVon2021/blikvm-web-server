import { createApiObj } from '../../common/api.js';

/**
 * Handles the API request and sends a JSON response with a hello world message.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
