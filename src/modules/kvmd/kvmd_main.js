import fs from 'fs';
import ModuleApp from '../module_app.js';

class KVMDMain extends ModuleApp {
  static _instance = null;

  constructor() {
    if (!KVMDMain._instance) {
      super();
      KVMDMain._instance = this;
      this._init();
    }

    return KVMDMain._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._bin = kvmd.bin;
    this._name = 'kvmd-main';
  }
}

export default KVMDMain;
