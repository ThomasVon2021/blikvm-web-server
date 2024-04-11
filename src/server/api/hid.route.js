import { ApiCode, createApiObj } from '../../common/api.js';
import HID from '../../modules/kvmd/kvmd_hid.js';

function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const action = req.query.action;
    const hid = new HID();
    if (action === 'enable') {
      hid
        .startService()
        .then(() => {
          ret.msg = 'hid enable success';
          res.json(ret);
        })
        .catch((err) => {
          ret.msg = err.message;
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(ret);
        });
    } else if (action === 'disable') {
      hid
        .closeService()
        .then(() => {
          ret.msg = 'hid disable success';
          res.json(ret);
        })
        .catch((err) => {
          ret.msg = err.message;
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(ret);
        });
    } else {
      ret.msg = 'input invalid hid command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(ret);
    }
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
