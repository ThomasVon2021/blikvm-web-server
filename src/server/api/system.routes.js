import { executeCMD } from '../../common/tool.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import fs from 'fs';

function apiReboot(req, res, next) {
  try {
    executeCMD('reboot');
  } catch (error) {
    next(error);
  }
}

function apiGetDevice(req, res, next) {
  try {
    const { device } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const { deviceinfo } = JSON.parse(fs.readFileSync(device, UTF8));
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    returnObject.data = {
      device: deviceinfo
    };
    res.json(returnObject);
  } catch (error) {
    next(error);
  }
}

export { apiReboot, apiGetDevice };
