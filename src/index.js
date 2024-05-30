import Logger from './log/logger.js';
import { fileExists, createFile, generateUniqueCode } from './common/tool.js';
import fs from 'fs';
import HttpServer from './server/server.js';
import Video from './modules/video/video.js';
import KVMDMain from './modules/kvmd/kvmd_main.js';
import ATX from './modules/kvmd/kvmd_atx.js';
import Janus from './modules/kvmd/kvmd_janus.js';
import HID from './modules/kvmd/kvmd_hid.js';

const logger = new Logger();

createSecretFile();

const httpServer = new HttpServer();
httpServer.startService().then((result) => {
  const hid = new HID();
  hid.startService();
  const video = new Video();
  video.startService();
  const kvmdmain = new KVMDMain();
  kvmdmain.startService();
  const janus = new Janus();
  janus.startService();
  const atx = new ATX();
  setTimeout(() => {
    console.log('Start ATX service');
    atx.startService();
  }, 5000); // 5000 ms delay start ATX service
});



/**
 * Creates or updates a secret file with a unique code, secret key, and empty OTP.
 * @private
 */
function createSecretFile() {
  const { firmwareObject } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
  if (!fileExists(firmwareObject.firmwareFile)) {
    createFile(firmwareObject.firmwareFile);
    const data = {
      user: 'admin',
      pwd: 'admin',
      id: generateUniqueCode()
    };
    fs.writeFileSync(firmwareObject.firmwareFile, JSON.stringify(data));
    logger.info(`Secret file created at ${firmwareObject.firmwareFile}`);
  }
}
