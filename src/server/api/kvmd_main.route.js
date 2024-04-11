import KVMDMain from '../../modules/kvmd/kvmd_main.js';
import { ApiCode, createApiObj } from '../../common/api.js';

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
    const action = req.query.action;
    const kvmdmain = new KVMDMain();

    if (action === 'start') {
      kvmdmain
        .startService()
        .then((result) => {
          ret.data.state = kvmdmain.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = kvmdmain.state;
          res.json(ret);
        });
    } else if (action === 'stop') {
      kvmdmain
        .closeService()
        .then((result) => {
          ret.data.state = kvmdmain.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = kvmdmain.state;
          res.json(ret);
        });
    } else {
      ret.msg = 'input invalid kvmdmain command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(ret);
    }
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
