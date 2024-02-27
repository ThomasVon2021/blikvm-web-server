import fs from 'fs';
import { spawn } from 'child_process';
import Logger from "../log/logger.js";

const logger = new Logger();

const VideoApiState = {
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
}


class ViedoApi {
  static _instance = null;

  _name = 'video_api';
  _option = null;
  _videoServer = null;
  _state=VideoApiState.STOPPED;

  constructor () {
    if (!ViedoApi._instance) {
      ViedoApi._instance = this;
      this._init();
    }

    return ViedoApi._instance;
  }

  startService () {
    return new Promise((resolve, reject) => {

      const shell = this._option.shell;
      const bin = this._option.bin;
      const port = this._option.port;
      this._videoServer = spawn(shell, [bin, port]);

      this._videoServer.stdout.on('data', data => {
        // logger.info(`video stdout: ${data}`);
      });

      this._videoServer.stderr.on('data', data => {
        // logger.info(`video stderr: ${data}`);
      });

      this._videoServer.on('error',err=>{
        this._state=VideoApiState.ERROR;
        logger.info(`video child process error: ${err.message}`);
      });
      this._videoServer.on('exit', (code,signal) => {
        logger.info(`video child process exited with code ${code} and signal ${signal}`);
      });
      this._videoServer.on('close', (code,signal) => {
        this._state=VideoApiState.STOPPED;
        logger.info(`video child process closed with code ${code} and signal ${signal}`);
      });

      this._state=VideoApiState.RUNNING;
      resolve({ name: this._name });
    })
  }

  closeService() {
    return new Promise((resolve, reject) => {
      this._videoServer.kill('SIGTERM');
  
      const checkState = () => {
        if (this._state === VideoApiState.STOPPED) {
          resolve({ name: this._name });
        } else {
          setTimeout(checkState, 200);
        }
      };
  
      checkState();
    });
  }

  _init () {
    const { videoApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = videoApi;
  }
}

export default ViedoApi;
export {VideoApiState};
