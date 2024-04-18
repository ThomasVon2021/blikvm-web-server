import Module from './module.js';
import Logger from '../log/logger.js';
import { SerialPort } from 'serialport';

const logger = new Logger();

class Serial extends Module {
  _process = null;
  _path = null;
  _baudRate = null;

  constructor(path, baudRate) {
    super();
    this._path = path;
    this._baudRate = baudRate;
  }

  startService() {
    logger.info(`Start ${this._name} service, path: ${this._path}, baudRate: ${this._baudRate}`);
    this._process = new SerialPort({
      path: this._path,
      baudRate: this._baudRate
    });
  }

  closeService() {
    if (this._process) {
      this._process.close();
    }
  }
}

export default Serial;
