import { ApiCode, createApiObj } from '../../common/api.js';
import HID from '../../modules/kvmd/kvmd_hid.js';

function apiEnable(req, res, next) {
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

function apiChangeMode(req, res, next) {
  try {
    const returnObject = createApiObj();
    const absolute = req.query.absolute;
    const hid = new HID();
    hid
      .changeMode(absolute)
      .then(() => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = `hid change mode to absolute:${absolute} successful`;
        res.json(returnObject);
      })
      .catch((err) => {
        returnObject.msg = err.message;
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(returnObject);
      });
  } catch (err) {
    next(err);
  }
}

function apiGetStatus(req, res, next) {
  try {
    const returnObject = createApiObj();
    const hid = new HID();
    returnObject.data = hid.getStatus();
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'hid get status ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

export { apiEnable, apiChangeMode, apiGetStatus };
