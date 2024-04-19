import fs from 'fs';
import Logger from '../../log/logger.js';
import Serial from '../serial.js';
import { ModuleState } from '../../common/enums.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

const logger = new Logger();

const ChannelCode = {
  ChannelNone: 'None',
  Channel1: 'G01gA',
  Channel2: 'G02gA',
  Channel3: 'G03gA',
  Channel4: 'G04gA'
};

const ChannelCommand = {
  Channel1: 'SW1\r\nG01gA',
  Channel2: 'SW1\r\nG01gA',
  Channel3: 'SW1\r\nG01gA',
  Channel4: 'SW1\r\nG01gA'
};

class KVMDBliSwitchV1 {
  static _instance = null;
  _serialHandle = null;
  _channel = ChannelCode.ChannelNone;
  _state = ModuleState.STOPPED;

  constructor() {
    if (!KVMDBliSwitchV1._instance) {
      KVMDBliSwitchV1._instance = this;
      this._init();
    }

    return KVMDBliSwitchV1._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._path = kvmd.switch.devicePath;
    this._name = kvmd.switch.module;
    this._baudRate = 19200;
    logger.info(`KVMDBliSwitchV1 init success, path: ${this._path}, name: ${this._name}`);
  }

  enableSwitch() {
    return new Promise((resolve, reject) => {
      try {
        if (this._state === ModuleState.RUNNING) {
          resolve({
            result: false,
            msg: 'Switch is already running'
          });
          return;
        }

        const obj = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

        if (obj.kvmd.switch.enabled === false) {
          obj.kvmd.switch.enabled = true;
          const updatedJsonContent = JSON.stringify(obj);
          fs.writeFileSync(CONFIG_PATH, updatedJsonContent, UTF8);
        }

        this._serialHandle = new Serial(this._path, this._baudRate);
        this._serialHandle.startService();

        this._serialHandle._process.on('open', () => {
          logger.info(`${this._name} open success`);
          this._state = ModuleState.RUNNING;
          resolve({
            result: true,
            msg: 'Switch is running'
          });
        });

        this._serialHandle._process.on('error', (err) => {
          logger.error(`${this._name} error: ${err.message}`);
          reject(err);
        });

        this._serialHandle._process.on('close', () => {
          this._state = ModuleState.STOPPED;
          logger.info(`${this._name} closed`);
        });

        this._serialHandle._process.on('data', (data) => {
          logger.debug(`${this._name} data: ${data}`);
          if (data.includes(ChannelCode.Channel1)) {
            this._channel = ChannelCode.Channel1;
          } else if (data.includes(ChannelCode.Channel2)) {
            this._channel = ChannelCode.Channel2;
          } else if (data.includes(ChannelCode.Channel3)) {
            this._channel = ChannelCode.Channel3;
          } else if (data.includes(ChannelCode.Channel4)) {
            this._channel = ChannelCode.Channel4;
          } else {
            this._channel = ChannelCode.ChannelNone;
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disableSwitch() {
    return new Promise((resolve, reject) => {
      if (this._state !== ModuleState.RUNNING) {
        resolve({
          result: false,
          msg: `Switch state is ${this._state} can't be disabled`
        });
      }
      this._serialHandle.closeService();
      const obj = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if (obj.kvmd.switch.enabled === true) {
        obj.kvmd.switch.enabled = false;
        // Convert the updated object back to JSON format
        const updatedJsonContent = JSON.stringify(obj);
        fs.writeFileSync(CONFIG_PATH, updatedJsonContent, UTF8);
      }
      this._serialHandle = null;
      resolve({
        result: true,
        msg: 'Switch is disabled'
      });
    });
  }

  getChannel() {
    return this._channel;
  }

  getState() {
    return this._state;
  }

  switchChannel(channel) {
    if (this._state !== ModuleState.RUNNING) {
      return {
        result: false,
        msg: 'Switch is not in enabled state'
      };
    }
    if (channel === ChannelCode.Channel1) {
      this._serialHandle.write(ChannelCommand.Channel1);
    } else if (channel === ChannelCode.Channel2) {
      this._serialHandle.write(ChannelCommand.Channel2);
    } else if (channel === ChannelCode.Channel3) {
      this._serialHandle.write(ChannelCommand.Channel3);
    } else if (channel === ChannelCode.Channel4) {
      this._serialHandle.write(ChannelCommand.Channel4);
    }
    return {
      result: true,
      msg: `Switch to ${channel} success`
    };
  }
}

export default KVMDBliSwitchV1;
