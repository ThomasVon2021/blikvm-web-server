import { ApiCode, createApiObj } from '../../common/api.js';
import KVMDSwitchV1 from '../../modules/kvmd/kvmd_switch_v1.0.js';

function _enableSwitch(req, res, next) {
  try {
    const returnObject = createApiObj();
    const kvmdSwitch = new KVMDSwitchV1();
    kvmdSwitch
      .enableSwitch()
      .then((result) => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = result.msg;
        res.json(returnObject);
      })
      .catch((error) => {
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        returnObject.msg = error.message;
        res.json(returnObject);
      });
  } catch (err) {
    next(err);
  }
}

function _disableSwitch(req, res, next) {
  try {
    const returnObject = createApiObj();
    const kvmdSwitch = new KVMDSwitchV1();
    kvmdSwitch
      .disableSwitch()
      .then((result) => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = result.msg;
        res.json(returnObject);
      })
      .catch((error) => {
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        returnObject.msg = error.message;
        res.json(returnObject);
      });
  } catch (err) {
    next(err);
  }
}

function apiEnableSwitch(req, res, next) {
  if (req.query.action === 'true') {
    _enableSwitch(req, res, next);
  } else if (req.query.action === 'false') {
    _disableSwitch(req, res, next);
  } else {
    const returnObject = createApiObj();
    returnObject.code = ApiCode.INVALID_INPUT_PARAM;
    returnObject.msg = `input error action: ${req.query.action}`;
    res.json(returnObject);
  }
}

function apiGetSwitchChannel(req, res, next) {
  try {
    const returnObject = createApiObj();
    const kvmdSwitch = new KVMDSwitchV1();
    const channel = kvmdSwitch.getChannel();
    const state = kvmdSwitch.getState();
    returnObject.data = {
      channel,
      state
    };
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiChangeChannel(req, res, next) {
  try {
    const returnObject = createApiObj();
    const kvmdSwitch = new KVMDSwitchV1();
    const channel = req.query.channel;
    const result = kvmdSwitch.switchChannel(channel);

    if (result.result === true) {
      returnObject.code = ApiCode.OK;
      returnObject.msg = result.msg;
    } else {
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = result.msg;
    }
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

export { apiEnableSwitch, apiGetSwitchChannel, apiChangeChannel };
