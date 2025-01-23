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
import {fileExists} from '../../common/tool.js'
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

class AppConfigUpdate {

  constructor() {
    this._filePath = CONFIG_PATH;
    this._defaultConfig = {
      "version": 2,
      "log": {
        "console": {
          "enabled": true,
          "level": "info"
        },
        "file": {
          "enabled": true,
          "level": "trace",
          "fileName": "/mnt/tmp/logs/app.log",
          "flags": "a",
          "maxLogSize": 30,
          "backups": 3
        }
      },
      "userManager": {
        "userFile": "./config/user.json"
      },
      "server": {
        "protocol": "https",
        "ssl": {
          "key": "./lib/https/key.pem",
          "cert": "./lib/https/cert.pem"
        },
        "rootPath": "/mnt/blikvm/web_src/web_server",
        "configPath": "/usr/bin/blikvm/package.json",
        "sshUser": "blikvm",
        "sshPassword": "blikvm",
        "auth": true
      },
      "video": {
        "port": 10004,
        "shell": "./lib/kvmd-video.sh",
        "bin": "./lib/pi/ustreamer.bin",
        "fps": 30,
        "quality": 80,
        "kbps": 5000,
        "gop": 30,
        "resolution": "1920x1080",
        "recordPath": "/mnt/tmp/record",
        "recordBin": "./lib/pi/ustreamer-dump"
      },
      "kvmd": {
        "bin": "./lib/pi/kvmd-main",
        "janusBin": "./lib/pi/janus",
        "switch": {
          "enabled": false,
          "devicePath": "/dev/ttyUSB0",
          "module": "BliKVM_switch_v1",
          "list": [
            "BliKVM_switch_v1",
            "BliKVM_switch_v2"
          ],
          "blikvm_switch_v1_lable": [
            "channel_1",
            "channel_2",
            "channel_3",
            "channel_4"
          ],
          "blikvm_switch_v2_lable": [
            "channel_1",
            "channel_2",
            "channel_3",
            "channel_4",
            "channel_5",
            "channel_6",
            "channel_7",
            "channel_8"
          ]
        }
      },
      "display": {
        "isActive": true,
        "mode": 1,
        "onBootTime": 3600,
        "cycleInterval": 60,
        "displayTime": 10
      },
      "atx": {
        "controlSockFilePath": "/var/blikvm/atx.sock",
        "stateSockFilePath": "/dev/shm/blikvm/atx",
        "power_on_delay": 500,
        "power_off_delay": 5000
      },
      "msd": {
        "isoFilePath": "/mnt/msd/user",
        "shell": "./lib/kvmd-msd.sh",
        "stateFilePath": "/mnt/msd/config/msd.json",
        "tusPort": 10002
      },
      "hid": {
        "hidEnable": "./lib/hid/enable-gadget.sh",
        "hidDisable": "./lib/hid/disable-gadget.sh",
        "enable": true,
        "absoluteMode": true,
        "mouseJiggler": false,
        "shortcuts": {
          "Ctrl+Alt+Del": [
            "ControlLeft",
            "AltLeft",
            "Delete"
          ],
          "Alt+Tab": [
            "AltLeft",
            "Tab"
          ],
          "Alt+F4": [
            "AltLeft",
            "F4"
          ],
          "Alt+Enter": [
            "AltLeft",
            "Enter"
          ],
          "Ctrl+W": [
            "ControlLeft",
            "KeyW"
          ]
        }
      }
    };
  }

  upgradeV1toV2(data) {
    if (data.server.protocol === undefined) {
      server.server.protocol = 'https'; 
    }
    if (data.server.auth === undefined) {
      server.server.auth = true; 
    }
    data.version = 2;
    return data;
  }

  upgradeV2toV3(data) {
    data.version = 3;
    return data;
  }

  // 通用升级函数，检查当前版本并逐步升级
  upgradeData(data) {
    if (data.version === 1) {
      logger.info('Upgrading from version 1 to version 2...');
      data = this.upgradeV1toV2(data);
    }
    return data;
  }

  // 升级配置文件
  upgradeFile() {
    try {
      // const app_config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if(fileExists(this._filePath) === false){
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const localData = JSON.parse(fs.readFileSync(this._filePath, UTF8));
      if (!localData.version) {
        logger.warn('No user config version found, use latest default config');
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const upgradedData = this.upgradeData(localData);

      fs.writeFileSync(this._filePath, JSON.stringify(upgradedData, null, 2), UTF8);

      logger.info('File successfully upgraded!');

    } catch (error) {
      logger.error(`${error}`);
    }
  }
}

export default AppConfigUpdate;