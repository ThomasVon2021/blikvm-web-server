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
import Logger from './log/logger.js';
import { fileExists, createFile, generateUniqueCode, getHardwareType } from './common/tool.js';
import { HardwareType } from './common/enums.js';
import fs from 'fs';
import HttpServer from './server/server.js';
import Video from './modules/video/video.js';
import KVMDMain from './modules/kvmd/kvmd_main.js';
import ATX from './modules/kvmd/kvmd_atx.js';
import Janus from './modules/kvmd/kvmd_janus.js';
import HID from './modules/kvmd/kvmd_hid.js';
import KVMSwitchFactory from './modules/kvmd/switch/kvmd_switch.js';
import { CONFIG_PATH, UTF8 } from './common/constants.js';
import {NotificationType, Notification } from './modules/notification.js';
import UserConfigUpdate from './modules/update/user_update.js';

const logger = new Logger();
const notification = new Notification();


const userConfigUpdate = new UserConfigUpdate();
userConfigUpdate.upgradeFile();

const httpServer = new HttpServer();
httpServer.startService().then((result) => {
  startHid();
  const video = new Video();
  video.startService();
  const kvmdmain = new KVMDMain();
  kvmdmain.startService();
  startJanus();
  startSwitch();
  const atx = new ATX();
  setTimeout(() => {
    atx.startService();
  }, 5000); // 5000 ms delay start ATX service
})
.finally(() => {
  logger.info("All services have been started.");
  notification.addMessage(NotificationType.INFO, 'All services have been started.');
});

// function start switch
function startSwitch() {
  const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if (kvmd.switch.enabled === true) {
    const switchHandle = KVMSwitchFactory.getSwitchHandle(kvmd.switch.module);
    switchHandle.enableSwitch();
  }
}

function startHid() {
  const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if (hid.enable === true) {
    const hidHandle = new HID();
    const mode = hid.absoluteMode ? 'true' : 'false';
    hidHandle.startService(mode);
  }
}

function startJanus(){
  const hardwareType = getHardwareType();
  if(hardwareType === HardwareType.CM4 ||  hardwareType === HardwareType.PI4B ){
    
    const janus = new Janus();
    janus.startService();
  }
}
