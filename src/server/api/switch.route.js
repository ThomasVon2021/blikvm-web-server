
/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/
import { ApiCode, createApiObj } from '../../common/api.js';
import KVMSwitchFactory from '../../modules/kvmd/switch/kvmd_switch.js';
import { CONFIG_PATH } from '../../common/constants.js';
import fs from 'fs';

function _enableSwitch(req, res, next) {
  try {
    const returnObject = createApiObj();
    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(req.query.module);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error module: ${req.query.module}`;
      res.json(returnObject);
      return;
    }
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
    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(req.query.module);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error module: ${req.query.module}`;
      res.json(returnObject);
      return;
    }

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

function apiGetSwitchState(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(req.query.module);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error module: ${req.query.module}`;
      res.json(returnObject);
      return;
    }

    const lable = kvmdSwitch.getLable();
    const channel = kvmdSwitch.getChannel();
    const state = kvmdSwitch.getState();

    returnObject.data = {
      state,
      enabled: kvmd.switch.enabled,
      channel,
      module: kvmd.switch.module,
      devicePath: kvmd.switch.devicePath,
      channelLable: lable
    };
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiSetSwitchDevicePath(req, res, next) {
  try {
    const returnObject = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config.kvmd.switch.devicePath = req.body.devicePath;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'set switch device path';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiSetSwitchLabel(req, res, next) {
  try {
    const returnObject = createApiObj();

    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(req.body.module);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error module: ${req.body.module}`;
      res.json(returnObject);
      return;
    }

    kvmdSwitch.setLable(req.body.channelLable);

    returnObject.code = ApiCode.OK;
    returnObject.msg = 'set switch lable ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiChangeChannel(req, res, next) {
  try {
    const returnObject = createApiObj();

    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(req.query.module);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error module: ${req.query.module}`;
      res.json(returnObject);
      return;
    }

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

function apiGetSwitchList(req, res, next) {
  try {
    const returnObject = createApiObj();
    const list = KVMSwitchFactory.getSwitchList();
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    returnObject.data = {
      module: kvmd.switch.module,
      list
    };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiSetSwitchModule(req, res, next) {
  try {
    const returnObject = createApiObj();
    const result = KVMSwitchFactory.setSwitchModle(req.query.module);
    if (result === true) {
      KVMSwitchFactory.getSwitchHandle(req.query.module);
      returnObject.code = ApiCode.OK;
      returnObject.msg = 'set switch modle success';
    } else {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error modle: ${req.query.module}`;
    }

    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

export {
  apiEnableSwitch,
  apiGetSwitchState,
  apiChangeChannel,
  apiSetSwitchDevicePath,
  apiSetSwitchLabel,
  apiGetSwitchList,
  apiSetSwitchModule
};
