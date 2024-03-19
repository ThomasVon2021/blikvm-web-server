import HttpApi from '../../http_api/http_api.js';

/**
 * Handles the API request to close the HTTP service.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const httpApi = new HttpApi();

    httpApi
      .closeService()
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
