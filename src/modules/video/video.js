import fs from 'fs';
import ModuleApp from '../module_app.js';
import { getRequest } from "../../common/http.js"

class Video extends ModuleApp {
  static _instance = null;

  constructor() {
    if (!Video._instance) {
      super();
      Video._instance = this;
      this._init();
    }

    return Video._instance;
  }

  _init() {
    const { video } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._bin = video.shell;
    this._para = [video.bin, video.port, video.fps, video.quality, video.kbps, video.gop];
    this._name = 'video';
  }

  getVideoConfig() {
    const { video } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const videoConfig = {
      port: video.port,
      fps: video.fps,
      quality: video.quality,
      kbps: video.kbps,
      gop: video.gop
    };
    return videoConfig;
  }

  getVideoState() {
    return new Promise((resolve, reject) => {
      getRequest(`http://127.0.0.1:${this._para[1]}/state`)
        .then(response => {
          try {
            const jsonData = JSON.parse(response);
            resolve(jsonData);
          } catch (error) {
            reject(`error: ${error.message}`);
          }
        })
        .catch(error => {
          reject(`error: ${error}`); 
        });
    });
  }
  

  setVideoConfig(videoConfig) {
    const configPath = 'config/app.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.video.fps = videoConfig.fps;
    config.video.quality = videoConfig.quality;
    config.video.kbps = videoConfig.kbps;
    config.video.gop = videoConfig.gop;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

export default Video;
