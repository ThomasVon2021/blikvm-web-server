import Logger from './log/logger.js';
import { existFile, createFile, generateUniqueCode } from './common/tool.js';
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
  const atx = new ATX();
  atx.startService();
  const janus = new Janus();
  janus.startService();
});

/**
 * Creates or updates a secret file with a unique code, secret key, and empty OTP.
 * @private
 */
function createSecretFile() {
  const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
  if (!existFile(other.secretFile)) {
    createFile(other.secretFile);
    const data = {
      user: 'admin',
      pwd: 'admin',
      id: generateUniqueCode()
    };
    fs.writeFileSync(other.secretFile, JSON.stringify(data));
    logger.info(`Secret file created at ${other.secretFile}`);
  }
}
