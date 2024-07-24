import fs from 'fs';
import ModuleApp from '../module_app.js';

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
