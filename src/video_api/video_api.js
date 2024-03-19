import fs from 'fs';
import { spawn } from 'child_process';
import Logger from '../log/logger.js';

const logger = new Logger();

/**
 * Represents the state of the video API.
 * @enum {string}
 */
const VideoApiState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

/**
 * Represents the error codes used in the video API.
 * @enum {string}
 */
const ErrorCode = {
  OK: 'OK',
  RUN_FAILD: 'RUN_FAILD',
  CLOSE_TIMEOUT: 'CLOSE_TIMEOUT'
};

/**
 * Represents the Video API.
 */
class ViedoApi {
  /**
   * Represents the singleton instance of the VideoApi class.
   * @type {VideoApi|null}
   * @private
   */
  static _instance = null;

  /**
   * The name of the video API.
   * @type {string}
   */
  _name = 'video_api';

  /**
   * Represents the option for the video API.
   * @type {?}
   */
  _option = null;

  /**
   * Represents the video server.
   * @type {null}
   */
  _videoServer = null;

  /**
   * Represents the state of the video API.
   * @type {VideoApiState}
   */
  _state = VideoApiState.STOPPED;

  /**
   * Timeout value for the video API.
   * @type {number}
   * @private
   */
  _timeout = 3000;

  /**
   * Represents the error code.
   * @type {number}
   */
  _error = ErrorCode.OK;

  /**
   * Error message for the video API.
   * @type {string}
   * @private
   */
  _errorMsg = '';

  /**
   * Represents the VideoApi class.
   * @constructor
   */
  constructor() {
    if (!ViedoApi._instance) {
      ViedoApi._instance = this;
      this._init();
    }

    return ViedoApi._instance;
  }

  /**
   * Get the state of the video API.
   *
   * @returns {string} The current state of the video API.
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   *
   * @param {any} value - The new value for the state.
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the video service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and check message.
   * @throws {Object} An object containing the service name, port, and check message if the service fails to start.
   */
  startService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._startServiceStateCheck();

      const result = {
        name: this._name,
        port: this._option.port,
        msg: checkMessage
      };

      if (checkResult === false) {
        reject(result);
        return;
      }

      if (this._state === VideoApiState.RUNNING) {
        resolve(result);
        return;
      }

      const shell = this._option.shell;
      const bin = this._option.bin;
      const port = this._option.port;
      this._videoServer = spawn(shell, [bin, port]);

      this._videoServer.stdout.on('data', (data) => {
        logger.trace(`Video API stdout: ${data}`);
      });

      this._videoServer.stderr.on('data', (data) => {
        logger.trace(`Video API stderr: ${data}`);
      });

      this._videoServer.on('error', (err) => {
        this._state = VideoApiState.ERROR;
        this._error = ErrorCode.RUN_FAILD;
        this._errorMsg = err.message;
        logger.error(`Video API error: ${err.message}`);
        reject(result);
      });
      this._videoServer.on('exit', (code, signal) => {
        logger.info(`Video API exited with code ${code} and signal ${signal}`);
      });
      this._videoServer.on('close', (code, signal) => {
        this._state = VideoApiState.STOPPED;
        logger.info(`Video API closed with code ${code} and signal ${signal}`);
      });

      this._state = VideoApiState.STARTING;
      setTimeout(() => {
        if (this._state === VideoApiState.ERROR) {
          return;
        }
        this._state = VideoApiState.RUNNING;
        logger.info(
          `Video API started at http://localhost:${this._option.port}/stream, state: ${this._state}`
        );
        resolve(result);
      }, 200);
    });
  }

  /**
   * Closes the video service.
   * @returns {Promise} A promise that resolves with the result object or rejects with an error object.
   */
  closeService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._closeServiceStateCheck();
      const result = {
        name: this._name,
        port: this._option.port,
        msg: checkMessage
      };

      if (checkResult === false) {
        reject(result);
        return;
      }
      if (this._state === VideoApiState.STOPPED) {
        resolve(result);
        return;
      }

      this._videoServer.kill('SIGTERM');
      this._state = VideoApiState.STOPPING;

      const startTime = Date.now();

      const checkState = () => {
        if (this._state === VideoApiState.STOPPED) {
          resolve(result);
        } else {
          const currentTime = Date.now();
          if (currentTime - startTime > this._timeout) {
            this._error = ErrorCode.CLOSE_TIMEOUT;
            this._errorMsg = 'Video API close timeout';
            result.msg = 'Video API close timeout';
            logger.error('Video API error : close timeout');
            reject(result);
          } else {
            setTimeout(checkState, 200);
          }
        }
      };

      checkState();
    });
  }

  /**
   * Checks the state of the Video API service and returns the result and message.
   *
   * @returns {Object} - An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the Video API service.
   */
  _startServiceStateCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case VideoApiState.STARTING:
        checkMessage = 'Video API is starting, please wait.';
        break;
      case VideoApiState.RUNNING:
        checkResult = true;
        checkMessage = 'Video API is running.';
        break;
      case VideoApiState.STOPPING:
        checkMessage = 'Video API is stopping, please wait.';
        break;
      case VideoApiState.STOPPED:
        checkResult = true;
        checkMessage = 'Video API is stopped.';
        break;
      case VideoApiState.ERROR:
        switch (this._error) {
          case ErrorCode.RUN_FAILD:
            checkResult = true;
            checkMessage = this._errorMsg;
            break;
          case ErrorCode.CLOSE_TIMEOUT:
            checkMessage = this._errorMsg;
            break;
          default:
            checkMessage = 'Video Error is unknown.';
            break;
        }
        break;
      default:
        checkMessage = 'Video API state is unknown.';
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  /**
   * Checks the state of the Video API service and returns the result and message.
   *
   * @param {string} state - The state of the Video API service.
   * @returns {Object} - An object containing the check result and message.
   */
  _closeServiceStateCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case VideoApiState.STARTING:
        checkMessage = 'Video API is starting, please wait.';
        break;
      case VideoApiState.RUNNING:
        checkResult = true;
        checkMessage = 'Video API is running.';
        break;
      case VideoApiState.STOPPING:
        checkMessage = 'Video API is stopping, please wait.';
        break;
      case VideoApiState.STOPPED:
        checkResult = true;
        checkMessage = 'Video API is stopped';
        break;
      case VideoApiState.ERROR:
        switch (this._error) {
          case ErrorCode.RUN_FAILD:
            checkMessage = this._errorMsg;
            break;
          case ErrorCode.CLOSE_TIMEOUT:
            checkResult = true;
            checkMessage = this._errorMsg;
            break;
          default:
            checkMessage = 'Video Error is unknown.';
            break;
        }
        break;
      default:
        checkMessage = 'Video API state is unknown.';
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  /**
   * Initializes the video API by reading the configuration from 'config/app.json'.
   * @private
   */
  _init() {
    const { videoApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = videoApi;
  }
}

export default ViedoApi;
export { VideoApiState };
