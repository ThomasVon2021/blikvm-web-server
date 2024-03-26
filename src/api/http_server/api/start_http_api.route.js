import HttpApi from '../../http_api/http_api.js';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the HTTP API request.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const httpApi = new HttpApi();

    httpApi
      .startService()
      .then((result) => {
        ret.data.state = httpApi.state;
        res.json(ret);
      })
      .catch((result) => {
        ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
        ret.msg = result.msg;
        ret.data.state = httpApi.state;
        res.json(ret);
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
