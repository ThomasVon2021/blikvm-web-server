import fs from 'fs';
import Logger from '../../../log/logger.js';
import Serial from '../../serial.js';
import { ModuleState } from '../../../common/enums.js';
import { CONFIG_PATH, UTF8, BliKVMSwitchV1ModuleName } from '../../../common/constants.js';
import KVMSwitchBase from "./kvmd_switch_base.js"
import { isDeviceFile } from "../../../common/tool.js"

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
  Channel2: 'SW1\r\nG02gA',
  Channel3: 'SW1\r\nG03gA',
  Channel4: 'SW1\r\nG04gA'
};

class KVMDBliSwitchV1 extends  KVMSwitchBase{
  _serialHandle = null;

  constructor() {
    super(); 
    this._init();
  }

  _init() {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._path = config.kvmd.switch.devicePath;
    this._name = BliKVMSwitchV1ModuleName;
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
        
        if( isDeviceFile(this._path) === false){
          logger.error(`Switch path ${this._path} is not exist`);
          resolve({
            result: false,
            msg: `Switch path ${this._path} is not exist`
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
          const current_data = data.toString().trim();
          if( this._last_data !== current_data){
            logger.info(`${this._name} data: ${data}`);
            this._last_data = current_data;
            if (data.includes(ChannelCode.Channel1)) {
              this._channel = this.getLable()[0];
            } else if (data.includes(ChannelCode.Channel2)) {
              this._channel = this.getLable()[1];
            } else if (data.includes(ChannelCode.Channel3)) {
              this._channel = this.getLable()[2];
            } else if (data.includes(ChannelCode.Channel4)) {
              this._channel = this.getLable()[3];
            } else {
              this._channel = ChannelCode.ChannelNone;
            }
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

  switchChannel(channel) {
    if (this._state !== ModuleState.RUNNING) {
      return {
        result: false,
        msg: 'Switch is not in running state'
      };
    }
    const {kvmd} = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if (channel === kvmd.switch.blikvm_switch_v1_lable[0]) {
      this._serialHandle.write(ChannelCommand.Channel1);
    } else if (channel === kvmd.switch.blikvm_switch_v1_lable[1]) {
      this._serialHandle.write(ChannelCommand.Channel2);
    } else if (channel === kvmd.switch.blikvm_switch_v1_lable[2]) {
      this._serialHandle.write(ChannelCommand.Channel3);
    } else if (channel === kvmd.switch.blikvm_switch_v1_lable[3]) {
      this._serialHandle.write(ChannelCommand.Channel4);
    }else{
      return {
        result: false,
        msg: 'input error channel'
      };
    }
    return {
      result: true,
      msg: `Switch to ${channel}`
    };
  }

  getLable(){
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const lable = kvmd.switch.blikvm_switch_v1_lable;
    return lable;
  }

  setLable(lable){
    const config  = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config.kvmd.switch.blikvm_switch_v1_lable = lable;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  }
}

export default KVMDBliSwitchV1;
