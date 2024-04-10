import fs from 'fs';

const ATXState = {
  LED_PWR: 0b01000000,
  LED_HDD: 0b00001000
};

class ATX {
  static _instance = null;
  _socketPath = null;
  _client = null;
  _ledPwr = false;
  _ledHDD = false;

  constructor() {
    if (!ATX._instance) {
      ATX._instance = this;
      this._init();
    }

    return ATX._instance;
  }

  _init() {
    const { atx } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._socketPath = atx.stateSockPath;
  }

  startService() {
    this.watcher = fs.watch(this._socketPath, { encoding: 'utf-8' }, (eventType, filename) => {
      if (filename) {
        this._readFileContent()
          .then((content) => {
            // console.log('ATX state: ', content[0]);
            if (content[0] & ATXState.LED_PWR) {
              this._ledPwr = true;
            } else {
              this._ledPwr = false;
            }
            if (content[0] & ATXState.LED_HDD) {
              this._ledHDD = true;
            } else {
              this._ledHDD = false;
            }
          })
          .catch((err) => {
            console.error('Error reading file:', err);
          });
      }
    });
  }

  closeService() {
    // 停止监听文件变化
    if (this.watcher) {
      this.watcher.close();
      console.log(`Stopped watching file: ${this._socketPath}`);
    }
  }

  getATXState() {
    return {
      ledPwr: this._ledPwr,
      ledHDD: this._ledHDD
    };
  }

  _readFileContent() {
    return fs.promises.readFile(this._socketPath);
  }
}

export default ATX;
