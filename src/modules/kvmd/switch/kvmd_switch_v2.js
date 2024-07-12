import fs from 'fs';
import Logger from '../../../log/logger.js';
import Serial from '../../serial.js';
import { ModuleState } from '../../../common/enums.js';
import { CONFIG_PATH, UTF8, BliKVMSwitchV2ModuleName } from '../../../common/constants.js';
import KVMSwitchBase from "./kvmd_switch_base.js"

const logger = new Logger();

const ChannelCode = {
  ChannelNone: 'None',
  Channel1: 'G01gA',
  Channel2: 'G02gA',
  Channel3: 'G03gA',
  Channel4: 'G04gA',
  Channel5: 'G05gA',
  Channel6: 'G06gA',
  Channel7: 'G07gA',
  Channel8: 'G08gA'
};

const ChannelCommand = {
  Channel1: 'SW1\r\nG01gA',
  Channel2: 'SW2\r\nG02gA',
  Channel3: 'SW3\r\nG03gA',
  Channel4: 'SW4\r\nG04gA',
  Channel5: 'SW5\r\nG05gA',
  Channel6: 'SW6\r\nG06gA',
  Channel7: 'SW7\r\nG07gA',
  Channel8: 'SW8\r\nG08gA'
};

class KVMDBliSwitchV2 extends  KVMSwitchBase{

  _serialHandle = null;
  _channel = ChannelCode.ChannelNone;
  _state = ModuleState.STOPPED;

  constructor() {
    super(); 
    this._init();
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._path = kvmd.switch.devicePath;
    this._name = BliKVMSwitchV2ModuleName;
    this._baudRate = 19200;
    logger.info(`KVMDBliSwitchV2 init success, path: ${this._path}, name: ${this._name}`);
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

        this._serialHandle = new Serial(this._path, this._baudRate);
        this._serialHandle.startService();

        this._serialHandle._process.on('open', () => {
          logger.info(`${this._name} open success`);
          this._state = ModuleState.RUNNING;
          const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
          if (config.kvmd.switch.enabled === false) {
            config.kvmd.switch.enabled = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
          }
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

      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if (config.kvmd.switch.enabled === true) {
        config.kvmd.switch.enabled = false;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
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

  getLable(){
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const lable = kvmd.switch.blikvm_switch_v2_lable;
    return lable;
  }

  setLable(lable){
    const config  = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config.kvmd.switch.blikvm_switch_v2_lable = lable;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  }
}

export default KVMDBliSwitchV2;