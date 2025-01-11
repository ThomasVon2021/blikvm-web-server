
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
import fs from 'fs';
import Logger from '../../../log/logger.js';
import Serial from '../../serial.js';
import { ByteLengthParser } from '@serialport/parser-byte-length'
import { ModuleState } from '../../../common/enums.js';
import { SWITCH_PATH, UTF8 } from '../../../common/constants.js';
import KVMSwitchBase from './kvmd_switch_base.js';
import { isDeviceFile } from '../../../common/tool.js';

const logger = new Logger();

class KVMDTesmartSwitchBase extends KVMSwitchBase {
  _serialHandle = null;
  _packetParser = null;
  _channel = -1;
  _state = ModuleState.STOPPED;
  _switchId = -1;
  constructor(switchId) {
    super();
    this._switchId = switchId;
    this._init();
  }

  _init() {
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    const item = switchObj.kvmSwitch.items.find(item => item.id === this._switchId);
    if (item === null) {
      logger.error('Can not find switch item');
      return;
    }
    this._id = item.id;
    this._path = item.deviceFile;
    this._name = item.title;
    this._baudRate = 9600;
    logger.info(`KVMDTesmartSwitchBase init success, path: ${this._path}, name: ${this._name}`);
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
        const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
        const item = switchObj.kvmSwitch.items.find(item => item.id === this._switchId);
        this._path = item.deviceFile;
        if (isDeviceFile(this._path) === false) {
          const text = `Switch path ${this._path} is not exist`;
          logger.error(text);
          this.sendErrorNotification(text);
          this._setConfigDisable();
          resolve({
            result: false,
            msg: `Switch path ${this._path} is not exist`
          });
          return;
        }
        this._serialHandle = new Serial(this._path, this._baudRate);
        this._serialHandle.startService();
        this._packetParser = this._serialHandle._process.pipe(new ByteLengthParser({ length: 6 }));

        this._serialHandle._process.on('open', () => {
          logger.info(`${this._name} open success`);
          this._state = ModuleState.RUNNING;
          const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
          if (switchObj.kvmSwitch.isActive === false) {
            switchObj.kvmSwitch.isActive = true;
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, this._switchId), UTF8);
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
        this._packetParser.on('data', (data) => {
          if (data[0] !== 0xAA || data[1] !== 0xBB || data[2] !== 0x03 || data[3] !== 0x11) {
            return;
          }
          const channel = data[4];
          if (this._channel !== channel) {
            logger.info(`${this._name} data: ${data}`);
            this._channel = channel;
            const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
            const item = switchObj.kvmSwitch.items.find(item => item.id === this._switchId);
            item.activeChannel = this._channel;
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, this._switchId), UTF8);
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

      this._setConfigDisable();

      this._serialHandle = null;
      this._packetParser = null;
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
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    const item = switchObj.kvmSwitch.items.find(item => item.id === this._switchId);
    if (item === null) {
      logger.error('Can not find switch item');
      return {
        result: false,
        msg: 'Switch is not in running state'
      };
    }

    for (let i = 0; i < item.channels.length; i++) {
      if (channel === item.channels[i].name) {
        this._serialHandle.write([0xAA, 0xBB, 0x03, 0x01, i+1, 0xEE]);
        return {
          result: true,
          msg: `Switch to ${channel} success`
        };
      }
    }
    return {
      result: false,
      msg: 'input error channel'
    };
  }
}

export default KVMDTesmartSwitchBase;
