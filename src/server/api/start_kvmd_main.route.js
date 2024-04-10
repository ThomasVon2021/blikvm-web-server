import KVMDMain from '../../modules/kvmd/kvmd_main.js';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the API request to start the kvmd-main service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const kvmdmain = new KVMDMain();

    kvmdmain
      .startService()
      .then((result) => {
        ret.data.state = kvmdmain.state;
        res.json(ret);
      })
      .catch((result) => {
        ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
        ret.msg = result.msg;
        ret.data.state = kvmdmain.state;
        res.json(ret);
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
