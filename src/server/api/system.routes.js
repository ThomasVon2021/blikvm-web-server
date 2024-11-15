
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
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import { getSystemInfo, executeCMD, getHardwareType } from '../../common/tool.js';
import { HardwareType } from '../../common/enums.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import {Notification, NotificationType} from '../../modules/notification.js';
import si from 'systeminformation';
import Logger from '../../log/logger.js';

const logger = new Logger();

const notification = new Notification();

function apiReboot(req, res, next) {
  try {
    executeCMD('reboot');
  } catch (error) {
    next(error);
  }
}

function readSerialNumber() {
  return new Promise((resolve, reject) => {
    fs.readFile('/proc/device-tree/serial-number', 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data.replace(/\u0000/g, '').trim());
    });
  });
}

function apiGetBoard(req, res, next) {
  try {
    Promise.all([si.system(), si.cpu(),readSerialNumber()])
      .then(([systemData, cpuData, serialNumber]) => {
        const returnObject = createApiObj();
        returnObject.code = ApiCode.OK;
        returnObject.data = {
          board: {
            manufacturer: systemData.manufacturer || 'Unknown',
            model: systemData.model || 'Unknown',
            version: systemData.version || 'Unknown',
            serial: systemData.serial || 'Unknown',
            type: systemData.type || 'Unknown',
            cpu: {
              manufacturer: cpuData.manufacturer || 'Unknown',
              processor: cpuData.brand || 'Unknown',
              revision: cpuData.revision || 'Unknown',
              vendor: cpuData.vendor || 'Unknown',            
            }
          }
        };
        const hardwareType = getHardwareType();
        if(hardwareType === HardwareType.MangoPi){
          returnObject.data.board.manufacturer = "MangoPi";
          returnObject.data.board.model = "MangoPi MCore";
          returnObject.data.board.serial = serialNumber;
          returnObject.data.board.type = "mangopi";
          returnObject.data.board.cpu.manufacturer = "Allwinner Technology Co";
          returnObject.data.board.cpu.processor = "H316 or H616";
        }else if(hardwareType === HardwareType.PI4B || hardwareType === HardwareType.CM4){
          returnObject.data.board.type = systemData.raspberry.type;
        }
        res.json(returnObject);
      })
      .catch(error => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
}

function apiGetDevice(req, res, next) {
  try {
    const { device } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const { deviceinfo, manufacturer } = JSON.parse(fs.readFileSync(device, UTF8));
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    const hardwareType = getHardwareType();
    let type = '';
    let deviceType = '';
    if( hardwareType === HardwareType.MangoPi){
      type ='mangoPi';
      deviceType = "BliKVM v4 Allwinner";
    }else if(hardwareType === HardwareType.PI4B ){
      type = 'pi';
      deviceType = "BliKVM v3 HAT";
    }else if( hardwareType === HardwareType.CM4 ){
      type = 'pi';
      deviceType = "BliKVM CM4";
    }
    returnObject.data = {
      device: deviceinfo,
      deviceType: deviceType,
      hardwareType: type,
      manufacturer: manufacturer
    };
    res.json(returnObject);
  } catch (error) {
    next(error);
  }
}


async function apiGetSystemInfo(req, res, next) {
  try {
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    returnObject.data = await getSystemInfo();
    res.json(returnObject);
  } catch (error) {
    next(error);
  }
}

const apiGetLogs = async (req, res, next) => {
  try {
    const { log } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const returnObject = createApiObj();

    const logDir = path.dirname(log.file.fileName);
    const logBaseName = path.basename(log.file.fileName);
    const logFiles = [
      path.join(logDir, logBaseName),
      path.join(logDir, `${logBaseName}.1`),
      path.join(logDir, `${logBaseName}.2`)
    ];

    const latestLogFile = logFiles
      .map(logFile => {
        if (fs.existsSync(logFile)) {
          return { file: logFile, mtime: fs.statSync(logFile).mtimeMs };
        }
        return null;
      })
      .filter(Boolean) 
      .sort((a, b) => b.mtime - a.mtime)[0]?.file;

    if (!latestLogFile) {
      notification.addMessage(NotificationType.ERROR, 'No log files found');
      return;
    }

    exec(`tail -n 20 ${latestLogFile}`, (err, stdout, stderr) => {
      if (err) {
        return next(err);
      }

      returnObject.code = ApiCode.OK;
      returnObject.data = stdout;
      res.json(returnObject);
    });
  } catch (error) {
    next(error);
  }
};

export { apiReboot, apiGetDevice, apiGetSystemInfo, apiGetLogs, apiGetBoard };
