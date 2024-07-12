import fs from 'fs';
import Logger from '../../../log/logger.js';
import { ModuleState } from '../../../common/enums.js';

const logger = new Logger();

class KVMSwitchBase {
  _name = 'None';
  _channel = 'None';
  _state = ModuleState.STOPPED;
  _last_data ='';

  enableSwitch() {
    throw new Error('must overwrite by children class');
  }

  disableSwitch() {
    throw new Error('must overwrite by children class');
  }

  getLable(){
    throw new Error('must overwrite by children class');
  }

  setLable(){
    throw new Error('must overwrite by children class');
  }

  getName(){
    return this._name;
  }

  getChannel() {
    return this._channel;
  }

  getState() {
    return this._state;
  }

  switchChannel() {
    throw new Error('must overwrite by children class');
  }
}

export default KVMSwitchBase;
