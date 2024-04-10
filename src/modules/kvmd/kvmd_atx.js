import fs from 'fs';
import Logger from '../../log/logger.js';
import Module from '../module.js';
import { ModuleState } from '../../common/enums.js';

const logger = new Logger();

const ATXState = {
  LED_PWR: 0b01000000,
  LED_HDD: 0b00001000
};

class ATX extends Module {
  static _instance = null;
  _socketPath = null;
  _client = null;
  _ledPwr = false;
  _ledHDD = false;

  constructor () {
    if (!ATX._instance) {
      super();
      ATX._instance = this;
      this._init();
    }

    return ATX._instance;
  }

  _init() {
    const { atx } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._socketPath = atx.stateSockPath;
    this._name = 'ATX';
  }

  startService () {
    this.watcher = fs.watch(this._socketPath, { encoding: 'utf-8' }, (eventType, filename) => {
      if (filename) {
        this._readFileContent()
          .then((content) => {
            if (content[0] & ATXState.LED_PWR) {
              this._ledPwr = true;
            } else {
              this._ledPwr = false;
            }
            if (content[0] & ATXState.LED_HDD) {
              this._ledHDD = true;
            } else {
              this._ledHDD = false;
            }
            this._state = ModuleState.RUNNING;
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
          });
      }
    });
  }

  closeService () {
    // 停止监听文件变化
    if (this.watcher) {
      this.watcher.close();
      this._state = ModuleState.STOPPED;
      logger.trace(`Stopped watching file: ${this._socketPath}`);
    }
  }

  getATXState () {
    return {
      ledPwr: this._ledPwr,
      ledHDD: this._ledHDD
    };
  }

  _readFileContent () {
    return fs.promises.readFile(this._socketPath);
  }
}

export default ATX;
