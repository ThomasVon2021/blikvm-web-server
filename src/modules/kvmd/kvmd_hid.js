import fs from 'fs';
import Logger from '../../log/logger.js';
import Module from '../module.js';
import { ModuleState } from '../../common/enums.js';
import { executeScriptAtPath, isDeviceFile } from '../../common/tool.js';

const logger = new Logger();

class HID extends Module {
  static _instance = null;
  _hidEnablePath = null;
  _hidDisablePath = null;
  _hidkeyboard = '/dev/hidg0';
  _hidmouse = '/dev/hidg1';

  constructor() {
    if (!HID._instance) {
      super();
      HID._instance = this;
      this._init();
    }
    return HID._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._name = 'HID';
    this._hidEnablePath = kvmd.hidEnable;
    this._hidDisablePath = kvmd.hidDisable;
  }

  startService() {
    return new Promise((resolve, reject) => {
      if (!isDeviceFile(this._hidkeyboard) && !isDeviceFile(this._hidmouse)) {
        logger.info(this._hidEnablePath);
        executeScriptAtPath(this._hidEnablePath)
          .then(() => {
            this._state = ModuleState.RUNNING;
            logger.info(`${this._name} started`);
            resolve();
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
            reject(err);
          });
      } else {
        this._state = ModuleState.RUNNING;
        logger.info(`${this._name} already running`);
        resolve();
      }
    });
  }

  closeService() {
    return new Promise((resolve, reject) => {
      executeScriptAtPath(this._hidDisablePath)
        .then(() => {
          this._state = ModuleState.STOPPED;
          resolve('hid disable success');
        })
        .catch((err) => {
          logger.error(`${this._name} error: ${err.message}`);
          reject(err);
        });
    });
  }
}

export default HID;
