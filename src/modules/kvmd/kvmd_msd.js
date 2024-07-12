import multer from 'multer';
import fs from 'fs';
import { ApiCode, createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';
import { exec } from 'child_process';
import progressStream from 'progress-stream';
import {
  executeCMD,
  getSystemType,
  changetoRWSystem,
  changetoROSystem,
  readVentoyDirectory
} from '../../common/tool.js';

const logger = new Logger();

const MSDImageType = {
  ventoy: 'ventoy',
  common: 'common'
};

class MSD {
  static _instance = null;
  _upload = null;
  _storage = null;
  _uploadProgress = 0;
  _makeImageProgress = 0;

  constructor() {
    if (!MSD._instance) {
      MSD._instance = this;
      this._init();
    }
    return MSD._instance;
  }

  _init() {
    this._name = 'MSD';
    this._storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        cb(null, msd.isoFilePath);
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    });
    this._upload = multer({ storage: this._storage }).single('image');
  }

  uploadMultipleAsync(req, res, next) {
    try {
      const returnObject = createApiObj();

      var progress = progressStream({length: '0'}); // 注意这里 length 设置为 '0'
      req.pipe(progress);
      progress.headers = req.headers;

      this._uploadProgress = 0;

      // 获取上传进度
      progress.on('progress', obj => {		
        this._uploadProgress = obj.percentage;
        //logger.info(`update progress: ${this._uploadProgress}`);
      });

      this._upload(progress, res, (err) => {
        if (err instanceof multer.MulterError) {
          logger.error(`${this._name} error: ${err.message}`);
          returnObject.msg = 'File upload error.';
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        } else if (err) {
          logger.error(`${this._name} error: ${err.message}`);
          next(err);
        } else {
          // const uploadedFileName = req.file.originalname;
          returnObject.msg = 'File uploaded successfully';
          returnObject.code = ApiCode.OK;
          this._uploadProgress = 0;
          res.json(returnObject);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  _checkCreateParams(req) {
    if (
      !req.body.type ||
      !(req.body.type === MSDImageType.ventoy || req.body.type === MSDImageType.common) ||
      !req.body.name ||
      !req.body.size ||
      !req.body.images
    ) {
      return false;
    }
    return true;
  }

  _parseProgress(data) {
    // 解析命令输出并提取拷贝进度信息
    const match = data.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : null;
  }

  _executeCmdCP(cmd, progressCallback) {
    return new Promise((resolve, reject) => {
      const childProcess = exec(cmd);

      childProcess.stdout.on('data', (data) => {
        const progress = this._parseProgress(data);
        if (progress !== null) {
          progressCallback(progress);
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`data: ${data}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  getMSDState() {
    const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const state = JSON.parse(fs.readFileSync(msd.stateFilePath, 'utf8'));
    return state;
  }

  createMSD(req, res, next) {
    try {
      const returnObject = createApiObj();
      const state = this.getMSDState();
      if (state.msd_img_created === 'created') {
        returnObject.msg = "msd drive alreadly created!";
        returnObject.code = ApiCode.ok;
        returnObject.data = state;
        res.json(returnObject);
        return;
      }

      if (!this._checkCreateParams(req)) {
        returnObject.msg = 'Invalid input parameters';
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        res.json(returnObject);
        return;
      }
      const type = req.body.type;
      const name = req.body.name;
      const size = req.body.size;
      const images = req.body.images.join(' ');

      const systemType = getSystemType();
      if (systemType === 'ro') {
        if (changetoRWSystem() === false) {
          returnObject.msg = 'change ro system to rw failed';
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
          return;
        }
      }

      this._makeImageProgress = 0;

      const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
      const cmd = `bash ${msd.shell} -c make -s ${size} -n ${name} -t ${type} -f ${images}`;
      logger.info(`Create MSD: ${cmd}`);
      this._executeCmdCP(cmd, (progress) => {
        logger.info(`make msd image progress: ${progress}`);
        this._makeImageProgress = progress;
      })
        .then(() => {
          returnObject.msg = 'create msd drive ok';
          returnObject.code = ApiCode.ok;
          this._makeImageProgress = 0;
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = `create msd image failed: ${err.message}`;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });

      if (systemType === 'ro') {
        if (changetoROSystem() === false) {
          logger.error('change rw system to ro failed');
        }
      }
    } catch (err) {
      next(err);
    }
  }

  connectMSD(req, res, next) {
    const returnObject = createApiObj();
    const state = this.getMSDState();
    if (state.msd_img_created !== 'created') {
      returnObject.msg = "usb drive not created, you can't exec conenct command";
      returnObject.code = ApiCode.ok;
      returnObject.data = state;
      res.json(returnObject);
      return;
    }
    const action = req.query.action;
    const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    if (action === 'true') {
      if( state.msd_status === 'connected' ){
        returnObject.msg = "usb drive alreadly conected to host";
        returnObject.code = ApiCode.ok;
        returnObject.data = state;
        res.json(returnObject);
        return;
      }
      logger.info('Connect MSD');
      const cmd = `bash ${msd.shell} -c conn`;
      executeCMD(cmd)
        .then(() => {
          returnObject.msg = `${cmd} ok`;
          returnObject.code = ApiCode.ok;
          returnObject.data = this.getMSDState();
          res.json(returnObject);
        })
        .catch((err) => {
          next(err);
        });
    } else {
      logger.info('disconnect MSD');
      if( state.msd_status === 'not_connected' ){
        returnObject.msg = "usb drive alreadly disconected to host";
        returnObject.code = ApiCode.ok;
        returnObject.data = state;
        res.json(returnObject);
        return;
      }
      const cmd = `bash ${msd.shell} -c disconn`;
      executeCMD(cmd)
        .then(() => {
          returnObject.msg = `${cmd} ok`;
          returnObject.code = ApiCode.ok;
          returnObject.data = this.getMSDState();
          res.json(returnObject);
        })
        .catch((err) => {
          next(err);
        });
    }
  }

  removeMSD(req, res, next) {
    const returnObject = createApiObj();
    const state = this.getMSDState();
    if (state.msd_img_created !== 'created') {
      returnObject.msg = "usb drive not created, you need to make first";
      returnObject.code = ApiCode.ok;
      returnObject.data = this.getMSDState();
      res.json(returnObject);
      return;
    }
    const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const cmd = `bash ${msd.shell} -c clean`;
    logger.info(`Remove MSD: ${cmd}`);
    executeCMD(cmd)
      .then(() => {
        returnObject.msg = 'remove msd image ok';
        returnObject.code = ApiCode.ok;
        returnObject.data = this.getMSDState();
        res.json(returnObject);
      })
      .catch((err) => {
        next(err);
      });
  }

  async getImages(dir) {
    const { msd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    try {
      const isos = await readVentoyDirectory(msd.isoFilePath);
      return isos;
    } catch (err) {
      logger.error(`Get all files in directory ${msd.isoFilePath} failed: ${err.message}`);
      return [];
    }
  }

  deleteImage(dir) {
    return new Promise((resolve, reject) => {
      fs.unlink(dir, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          reject(err);
        } else {
          console.log(`${dir} deleted successfully`);
          resolve(true);
        }
      });
    });
  }

  getUploadProgress(req, res) {
    const returnObject = createApiObj();
    const progress = this._uploadProgress;
    // logger.info(`getUploadProgress: ${progress}` );
    returnObject.msg = 'get the uplaod progress';
    returnObject.code = ApiCode.ok;
    returnObject.data = progress;
    res.json(returnObject);
  }

  getMakeImageProgress(req, res){
    const returnObject = createApiObj();
    const progress = this._makeImageProgress;
    returnObject.msg = 'get the make image progress';
    returnObject.code = ApiCode.ok;
    returnObject.data = progress;
    res.json(returnObject);
  }

}

export default MSD;