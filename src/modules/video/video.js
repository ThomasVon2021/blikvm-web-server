/**
 * This module defines the video API class that starts and stops the video service.
 * @module api/video_api/video_api
 */

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
 * @private
 */
const VideoApiErrorCode = {
  OK: 'OK',
  START_FAILD: 'START_FAILD'
};

/**
 * Represents the Video API.
 * @class
 * @property {VideoApiState} state - The state of the video API.
 */
class Video {
  /**
   * Represents the singleton instance of the VideoApi class.
   * @type {VideoApi}
   * @private
   */
  static _instance = null;

  /**
   * The name of the video API.
   * @type {string}
   * @private
   */
  _name = 'video';

  /**
   * Represents the option for the video API.
   * @type {Object}
   * @private
   */
  _option = null;

  /**
   * Represents the video server.
   * @type {ChildProcessWithoutNullStreams}
   * @private
   */
  _videoServer = null;

  /**
   * Represents the state of the video API.
   * @type {VideoApiState}
   * @private
   */
  _state = VideoApiState.STOPPED;

  /**
   * Represents the error code.
   * @type {VideoApiErrorCode}
   * @private
   */
  _error = VideoApiErrorCode.OK;

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
    if (!Video._instance) {
      Video._instance = this;
      this._init();
    }

    return Video._instance;
  }

  /**
   * Get the state of the video API.
   * @returns {VideoApiState} The current state of the video API.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   * @param {VideoApiState} value - The new value for the state.
   * @private
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the video service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the video service.
   * @property {number} port - The port number of the video service.
   * @property {string} msg - The message indicating the status of the video service.
   */
  startService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._startServiceCheck();

      const result = { name: this._name, port: this._option.port, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
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
        logger.error(`Video API error: ${err.message}`);
        this._state = VideoApiState.ERROR;
        this._error = VideoApiErrorCode.START_FAILD;
        this._errorMsg = err.message;
        result.msg = err.message;
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
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the video service.
   * @property {number} port - The port number of the video service.
   * @property {string} msg - The message indicating the status of the video service.
   */
  closeService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._closeServiceCheck();

      const result = { name: this._name, port: this._option.port, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
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
          if (currentTime - startTime > 3000) {
            logger.error('Video API error : close timeout');
            result.msg = 'Video API close timeout';
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
   * @returns {Object} - An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the Video API service.
   * @private
   */
  _startServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case VideoApiState.STARTING:
        checkMessage = 'Video API is starting, please wait.';
        break;
      case VideoApiState.RUNNING:
        checkMessage = 'Video API is running.';
        break;
      case VideoApiState.STOPPING:
        checkMessage = 'Video API is stopping, please wait.';
        break;
      case VideoApiState.STOPPED:
        checkResult = true;
        break;
      case VideoApiState.ERROR:
        switch (this._error) {
          case VideoApiErrorCode.START_FAILD:
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
   * Checks the state of the Video API service and returns the result and message.
   * @param {string} state - The state of the Video API service.
   * @returns {Object} - An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the Video API service.
   * @private
   */
  _closeServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case VideoApiState.STARTING:
        checkMessage = 'Video API is starting, please wait.';
        break;
      case VideoApiState.RUNNING:
        checkResult = true;
        break;
      case VideoApiState.STOPPING:
        checkMessage = 'Video API is stopping, please wait.';
        break;
      case VideoApiState.STOPPED:
        checkMessage = 'Video API is stopped';
        break;
      case VideoApiState.ERROR:
        switch (this._error) {
          case VideoApiErrorCode.START_FAILD:
            checkMessage = `Video API in error state: ${this._errorMsg}`;
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
   * Initializes the video API by reading the configuration from 'config/app.json'.
   * @private
   */
  _init() {
    const { video } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = video;
  }
}

export default Video;
export { VideoApiState };
