import { ModuleState } from '../common/enums.js';

class Module {
  _name = '';

  _state = ModuleState.STOPPED;

  get state() {
    return this._state;
  }

  startService() {
    return Promise.resolve();
  }

  closeService() {
    return Promise.resolve();
  }
}

export default Module;
