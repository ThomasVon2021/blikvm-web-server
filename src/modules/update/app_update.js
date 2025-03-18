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
import defaultConfig from './app_default_config.js';

const logger = new Logger();

class AppConfigUpdate {

  constructor() {
    this._filePath = CONFIG_PATH;
    this._defaultConfig = defaultConfig;
  }

  upgradeV1toV2(data) {
    if (data.server.protocol === undefined) {
      data.server.protocol = 'https'; 
    }
    if (data.server.auth === undefined) {
      data.server.auth = true; 
    }
    data.version = 2;
    return data;
  }

  upgradeV2toV3(data) {
    if(data.hid.pass_through === undefined){
      data.hid.pass_through = {
        enabled: false,
        mouse_sensitivity: 0.3
      };
    }
    if(data.server.https_port === undefined){
      data.server.https_port = 443;
    }
    if(data.server.http_port === undefined){
      data.server.http_port = 80;
    }
    if(data.server.authExpiration === undefined){
      data.server.authExpiration = 12;
    }
    if(data.server.ipWhite === undefined){
      data.server.ipWhite ={
        enable: false,
        list: []
      };
    }
    if(data.hid.jigglerTimeDiff === undefined){
      data.hid.jigglerTimeDiff = 60;
    }
    data.version = 3;
    return data;
  }

  upgradeV3toV4(data) {
    if(data.hid.mouseMode === undefined){
      data.hid.mouseMode = 'dual';
    }
    if(data.msd.enable === undefined){
      data.msd.enable = true;
    }
    data.version = 4;
    return data;
  }

  // 通用升级函数，检查当前版本并逐步升级
  upgradeData(data) {
    if (data.version === 1) {
      logger.info('Upgrading from version 1 to version 2...');
      data = this.upgradeV1toV2(data);
    }
    if (data.version === 2) {
      logger.info('Upgrading from version 2 to version 3...');
      data = this.upgradeV2toV3(data);
    }
    if (data.version === 3) {
      logger.info('Upgrading from version 3 to version 4...');
      data = this.upgradeV3toV4(data);
    }
    return data;
  }

  // 升级配置文件
  upgradeFile() {
    try {
      // const app_config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if(fileExists(this._filePath) === false){
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        logger.info(`write default config to ${this._filePath}`);
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

      logger.info('app.json file successfully update!');

    } catch (error) {
      logger.error(`${error}`);
    }
  }

  getDefaultConfig() {
    return this._defaultConfig;
  }
}

export default AppConfigUpdate;