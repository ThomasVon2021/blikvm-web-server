
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
import { fileExists, createFile, generateUniqueCode } from './common/tool.js';
import fs from 'fs';
import HttpServer from './server/server.js';
import Video from './modules/video/video.js';
import KVMDMain from './modules/kvmd/kvmd_main.js';
import ATX from './modules/kvmd/kvmd_atx.js';
import Janus from './modules/kvmd/kvmd_janus.js';
import HID from './modules/kvmd/kvmd_hid.js';
import KVMSwitchFactory from './modules/kvmd/switch/kvmd_switch.js';
import { CONFIG_PATH, UTF8 } from './common/constants.js';

const logger = new Logger();

createSecretFile();

const httpServer = new HttpServer();
httpServer.startService().then((result) => {
  startHid();
  const video = new Video();
  video.startService();
  const kvmdmain = new KVMDMain();
  kvmdmain.startService();
  const janus = new Janus();
  janus.startService();
  startSwitch();
  const atx = new ATX();
  setTimeout(() => {
    atx.startService();
  }, 5000); // 5000 ms delay start ATX service
});

/**
 * Creates or updates a secret file with a unique code, secret key, and empty OTP.
 * @private
 */
function createSecretFile() {
  const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if (!fileExists(userManager.userFile)) {
    createFile(userManager.userFile);
    const data = {
      user: 'admin',
      pwd: 'admin',
      id: generateUniqueCode()
    };
    fs.writeFileSync(userManager.userFile, JSON.stringify(data));
    logger.info(`Secret file created at ${userManager.userFile}`);
  }
}

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
