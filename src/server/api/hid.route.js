import { ApiCode, createApiObj } from '../../common/api.js';
import HID from '../../modules/kvmd/kvmd_hid.js';

function api(req, res, next) {
  try {
    const returnObject = createApiObj();
    const action = req.query.action;
    const hid = new HID();
    if (action === 'enable') {
      hid
        .startService()
        .then(() => {
          returnObject.msg = 'hid enable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else if (action === 'disable') {
      hid
        .closeService()
        .then(() => {
          returnObject.msg = 'hid disable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else {
      returnObject.msg = `input invalid hid command: ${action}`;
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
    }
  } catch (err) {
    next(err);
  }
}

export default api;
