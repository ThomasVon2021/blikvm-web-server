/**
 * This module defines the kvmd main API class that starts and stops the kvmd main service.
 * @module api/video_api/video_api
 */

import fs from 'fs';
import { spawn } from 'child_process';
import Logger from '../log/logger.js';

const logger = new Logger();

/**
 * Represents the state of the kvmd main API.
 * @enum {string}
 */
const KVMDMainState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

/**
 * Represents the error codes used in the kvmd main API.
 * @enum {string}
 * @private
 */
const KVMDMainErrorCode = {
  OK: 'OK',
  START_FAILD: 'START_FAILD'
};

/**
 * Represents the KVMDMain API.
 * @class
 * @property {KVMDMainState} state - The state of the kvmd main API.
 */
class KVMDMain {
  /**
   * Represents the singleton instance of the KVMDMain class.
   * @type {KVMDMain}
   * @private
   */
  static _instance = null;

  /**
   * The name of the kvmd main API.
   * @type {string}
   * @private
   */
  _name = 'kvmdmain';

  /**
   * Represents the option for the kvmd main API.
   * @type {Object}
   * @private
   */
  _option = null;

  /**
   * Represents the kvmd main server.
   * @type {ChildProcessWithoutNullStreams}
   * @private
   */
  _kvmdMainServer = null;

  /**
   * Represents the state of the kvmd main API.
   * @type {KVMDMainState}
   * @private
   */
  _state = KVMDMainState.STOPPED;

  /**
   * Represents the error code.
   * @type {KVMDMainErrorCode}
   * @private
   */
  _error = KVMDMainErrorCode.OK;

  /**
   * Error message for the kvmd main API.
   * @type {string}
   * @private
   */
  _errorMsg = '';

  /**
   * Represents the KVMDMain class.
   * @constructor
   */
  constructor() {
    if (!KVMDMain._instance) {
      KVMDMain._instance = this;
      this._init();
    }

    return KVMDMain._instance;
  }

  /**
   * Get the state of the kvmd main API.
   * @returns {KVMDMainState} The current state of the kvmd main API.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   * @param {KVMDMainState} value - The new value for the state.
   * @private
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the kvmd main service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the kvmd main service.
   * @property {number} port - The port number of the kvmd main service.
   * @property {string} msg - The message indicating the status of the kvmd main service.
   */
  startService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._startServiceCheck();

      const result = { name: this._name, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
        return;
      }

      const bin = this._option.bin;
      this._kvmdMainServer = spawn(bin);

      this._kvmdMainServer.stdout.on('data', (data) => {
        logger.trace(`KVMDMain API stdout: ${data}`);
      });

      this._kvmdMainServer.stderr.on('data', (data) => {
        logger.trace(`KVMDMain API stderr: ${data}`);
      });

      this._kvmdMainServer.on('error', (err) => {
        logger.error(`KVMDMain API error: ${err.message}`);
        this._state = KVMDMainState.ERROR;
        this._error = KVMDMainErrorCode.START_FAILD;
        this._errorMsg = err.message;
        result.msg = err.message;
        reject(result);
      });
      this._kvmdMainServer.on('exit', (code, signal) => {
        logger.info(`KVMDMain API exited with code ${code} and signal ${signal}`);
      });
      this._kvmdMainServer.on('close', (code, signal) => {
        this._state = KVMDMainState.STOPPED;
        logger.info(`KVMDMain API closed with code ${code} and signal ${signal}`);
      });

      this._state = KVMDMainState.STARTING;
      setTimeout(() => {
        if (this._state === KVMDMainState.ERROR) {
          return;
        }
        this._state = KVMDMainState.RUNNING;
        logger.info(
          `KVMDMain API started state: ${this._state}`
        );
        resolve(result);
      }, 200);
    });
  }

  /**
   * Closes the kvmd main service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the kvmd main service.
   * @property {number} port - The port number of the kvmd main service.
   * @property {string} msg - The message indicating the status of the kvmd main service.
   */
  closeService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._closeServiceCheck();

      const result = { name: this._name, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
        return;
      }

      this._kvmdMainServer.kill('SIGTERM');
      this._state = KVMDMainState.STOPPING;

      const startTime = Date.now();

      const checkState = () => {
        if (this._state === KVMDMainState.STOPPED) {
          resolve(result);
        } else {
          const currentTime = Date.now();
          if (currentTime - startTime > 3000) {
            logger.error('KVMDMain API error : close timeout');
            result.msg = 'KVMDMain API close timeout';
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
   * Checks the state of the KVMDMain API service and returns the result and message.
   * @returns {Object} - An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the KVMDMain API service.
   * @private
   */
  _startServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case KVMDMainState.STARTING:
        checkMessage = 'KVMDMain API is starting, please wait.';
        break;
      case KVMDMainState.RUNNING:
        checkMessage = 'KVMDMain API is running.';
        break;
      case KVMDMainState.STOPPING:
        checkMessage = 'KVMDMain API is stopping, please wait.';
        break;
      case KVMDMainState.STOPPED:
        checkResult = true;
        break;
      case KVMDMainState.ERROR:
        switch (this._error) {
          case KVMDMainErrorCode.START_FAILD:
            checkResult = true;
            break;
        }
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  /**
   * Checks the state of the KVMDMain API service and returns the result and message.
   * @param {string} state - The state of the KVMDMain API service.
   * @returns {Object} - An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the KVMDMain API service.
   * @private
   */
  _closeServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case KVMDMainState.STARTING:
        checkMessage = 'KVMDMain API is starting, please wait.';
        break;
      case KVMDMainState.RUNNING:
        checkResult = true;
        break;
      case KVMDMainState.STOPPING:
        checkMessage = 'KVMDMain API is stopping, please wait.';
        break;
      case KVMDMainState.STOPPED:
        checkMessage = 'KVMDMain API is stopped';
        break;
      case KVMDMainState.ERROR:
        switch (this._error) {
          case KVMDMainErrorCode.START_FAILD:
            checkMessage = `KVMDMain API in error state: ${this._errorMsg}`;
            break;
        }
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  /**
   * Initializes the kvmd main API by reading the configuration from 'config/app.json'.
   * @private
   */
  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = kvmd;
  }
}

export default KVMDMain;
export { KVMDMainState };
