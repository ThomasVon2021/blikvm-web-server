import HttpApi from '../../http_api/http_api.js';

/**
 * Handles the HTTP API request.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const httpApi = new HttpApi();

    httpApi
      .startService()
      .then((result) => {
        res.json({
          msg: 'successful'
        });
      })
      .catch((result) => {
        res.json({
          msg: `failed: ${result.msg}`
        });
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
