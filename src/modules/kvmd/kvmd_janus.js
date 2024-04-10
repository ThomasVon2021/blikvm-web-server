import fs from 'fs';
import ModuleApp from '../module_app.js';

class Janus extends ModuleApp {
  static _instance = null;

  constructor () {
    if (!Janus._instance) {
      super();
      Janus._instance = this;
      this._init();
    }

    return Janus._instance;
  }

  _init () {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._bin = kvmd.janusBin;
    this._name = 'janus';
  }
}

export default Janus;
