import HttpApi from '../../http_api/http_api.js';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the API request to close the HTTP service.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const httpApi = new HttpApi();

    httpApi
      .closeService()
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
