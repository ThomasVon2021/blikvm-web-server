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
    this._para = [video.bin, video.port];
    this._name = 'video';
  }
}

export default Video;
