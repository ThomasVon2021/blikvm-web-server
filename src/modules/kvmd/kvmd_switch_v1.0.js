import fs from 'fs';
import Logger from '../../log/logger.js';
import Serial from '../serial.js';
import { ModuleState } from '../../common/enums.js';

const logger = new Logger();

const ChannelStr = {
  ChannelNone: 'None',
  Channel1: 'G01gA',
  Channel2: 'G02gA',
  Channel3: 'G03gA',
  Channel4: 'G04gA'
};

const ControlChannelStr = {
  Channel1: 'SW1\r\nG01gA',
  Channel2: 'SW1\r\nG01gA',
  Channel3: 'SW1\r\nG01gA',
  Channel4: 'SW1\r\nG01gA'
};

class KVMDSwitchV1 {
  static _instance = null;
  _serialHandle = null;
  _channel = ChannelStr.ChannelNone;
  _state = ModuleState.STOPPED;

  constructor() {
    if (!KVMDSwitchV1._instance) {
      KVMDSwitchV1._instance = this;
      this._init();
    }

    return KVMDSwitchV1._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._path = kvmd.switch.devicePath;
    this._name = kvmd.switch.modle;
    this._baudRate = 19200;
    logger.info(`KVMDSwitchV1 init success, path: ${this._path}, name: ${this._name}`);
  }

  enableSwitch() {
    return new Promise((resolve, reject) => {
      try {
        if (this._state === ModuleState.RUNNING) {
          resolve({
            result: false,
            msg: 'Switch is already enabled'
          });
          return;
        }

        const obj = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));

        if (obj.kvmd.switch.enabled === false) {
          obj.kvmd.switch.enabled = true;
          const updatedJsonContent = JSON.stringify(obj);
          fs.writeFileSync('config/app.json', updatedJsonContent, 'utf8');
        }

        this._serialHandle = new Serial(this._path, this._baudRate);
        this._serialHandle.startService();

        this._serialHandle._process.on('open', () => {
          logger.info(`${this._name} open success`);
          this._state = ModuleState.RUNNING;
          resolve({
            result: true,
            msg: 'Switch is enabled'
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
          if (data.includes(ChannelStr.Channel1)) {
            this._channel = ChannelStr.Channel1;
          } else if (data.includes(ChannelStr.Channel2)) {
            this._channel = ChannelStr.Channel2;
          } else if (data.includes(ChannelStr.Channel3)) {
            this._channel = ChannelStr.Channel3;
          } else if (data.includes(ChannelStr.Channel4)) {
            this._channel = ChannelStr.Channel4;
          } else {
            this._channel = ChannelStr.ChannelNone;
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
      const obj = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
      if (obj.kvmd.switch.enabled === true) {
        obj.kvmd.switch.enabled = false;
        // Convert the updated object back to JSON format
        const updatedJsonContent = JSON.stringify(obj);
        fs.writeFileSync('config/app.json', updatedJsonContent, 'utf8');
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
        msg: 'Switch is not enabled'
      };
    }
    if (channel === ChannelStr.Channel1) {
      this._serialHandle.write(ControlChannelStr.Channel1);
    } else if (channel === ChannelStr.Channel2) {
      this._serialHandle.write(ControlChannelStr.Channel2);
    } else if (channel === ChannelStr.Channel3) {
      this._serialHandle.write(ControlChannelStr.Channel3);
    } else if (channel === ChannelStr.Channel4) {
      this._serialHandle.write(ControlChannelStr.Channel4);
    }
    return {
      result: true,
      msg: `Switch to ${channel} success`
    };
  }
}

export default KVMDSwitchV1;
