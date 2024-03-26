/**
 * This module defines the HTTP and WebSocket API server.
 * @module api/http_api/http_api
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from '../../log/logger.js';
import fs from 'fs';
import routes from './api/routes.js';
import { WebSocketServer, WebSocket } from 'ws';
import handleMouse from './mouse.js';
import handleKeyboard from './keyboard.js';
import { ApiErrorCode, createApiObj } from '../common/api.js';

const logger = new Logger();

/**
 * Represents the state of the HTTP API.
 * @enum {string}
 */
const HttpApiState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

/**
 * Represents the error codes used in the HTTP API.
 * @enum {string}
 * @private
 */
const HttpApiErrorCode = {
  OK: 'OK',
  RUN_FAILD: 'RUN_FAILD'
};

/**
 * Represents an HTTP API server.
 * @class
 * @property {HttpApiState} state - The state of the HTTP API.
 */
class HttpApi {
  /**
   * Represents the singleton instance of the HttpApi class.
   * @type {HttpApi}
   * @private
   */
  static _instance = null;

  /**
   * The name of the HTTP API.
   * @type {string}
   * @private
   */
  _name = 'httpApi';

  /**
   * Http server instance.
   * @type {Server<Request, Response>}
   * @private
   */
  _server = null;

  /**
   * WebSocket server instance.
   * @type {WebSocketServer}
   * @private
   */
  _wss = null;

  /**
   * Represents the options for the HTTP API.
   * @type {Object}
   * @private
   */
  _option = null;

  /**
   * Represents the state of the HttpApi.
   * @type {HttpApiState}
   * @private
   */
  _state = HttpApiState.STOPPED;

  /**
   * Represents the error code.
   * @type {HttpApiErrorCode}
   * @private
   */
  _error = HttpApiErrorCode.OK;

  /**
   * Error message variable.
   * @type {string}
   * @private
   */
  _errorMsg = '';

  /**
   * Represents the HttpApi class.
   * @constructor
   */
  constructor() {
    if (!HttpApi._instance) {
      HttpApi._instance = this;
      this._init();
    }

    return HttpApi._instance;
  }

  /**
   * Get the state of the HTTP API.
   * @returns {HttpApiState} The state of the HTTP API.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   * @param {HttpApiState} value - The new value for the state.
   * @private
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the HTTP service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the service.
   * @property {number} port - The port number of the service.
   * @property {string} msg - The message describing the state of the service.
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

      this._state = HttpApiState.STARTING;
      let timer = null;

      const startServer = () => {
        this._server.listen(this._option.port, () => {
          clearTimeout(timer);
          this._state = HttpApiState.RUNNING;
          logger.info(
            `Http Api started at http://localhost:${this._option.port}, state: ${this._state}`
          );
          logger.info(
            `WebSocket Api started at ws://localhost:${this._option.port}, state: ${this._state}`
          );
          resolve(result);
        });
      };

      timer = setTimeout(() => {
        if (this._error === HttpApiErrorCode.RUN_FAILD) {
          result.msg = this._errorMsg;
          reject(result);
        }
      }, 500);

      startServer();
    });
  }

  /**
   * Closes the HTTP API service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the service.
   * @property {number} port - The port number of the service.
   * @property {string} msg - The message describing the state of the service.
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

      this._state = HttpApiState.STOPPING;

      const wsClientNumber = this._wss.clients.size;
      this._wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      const checkClose = () => {
        if (wsClientNumber <= 0) {
          this._server.close(() => {
            this._state = HttpApiState.STOPPED;
            logger.info(
              `Http Api closed at http://localhost:${this._option.port}, state: ${this._state}`
            );
            logger.info(
              `WebSocket Api closed at ws://localhost:${this._option.port}, state: ${this._state}`
            );
            resolve(result);
          });
        } else {
          setTimeout(checkClose, 100);
        }
      };

      checkClose();
    });
  }

  /**
   * Checks the state of the HTTP API service and returns the result and message.
   * @returns {Object} An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the HTTP API service.
   * @private
   */
  _startServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case HttpApiState.STARTING:
        checkMessage = 'HTTP API is starting, please wait.';
        break;
      case HttpApiState.RUNNING:
        checkMessage = 'HTTP API is running.';
        break;
      case HttpApiState.STOPPING:
        checkMessage = 'HTTP API is stopping, please wait.';
        break;
      case HttpApiState.STOPPED:
        checkResult = true;
        break;
      case HttpApiState.ERROR:
        switch (this._error) {
          case HttpApiErrorCode.RUN_FAILD:
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
   * Checks the state of the HTTP API service and returns the result and message.
   * @returns {Object} An object containing the check result and message.
   * @property {boolean} checkResult - The result of the state check.
   * @property {string} checkMessage - The message describing the state of the HTTP API service.
   * @private
   */
  _closeServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case HttpApiState.STARTING:
        checkMessage = 'HTTP API is starting, please wait.';
        break;
      case HttpApiState.RUNNING:
        checkResult = true;
        break;
      case HttpApiState.STOPPING:
        checkMessage = 'HTTP API is stopping, please wait.';
        break;
      case HttpApiState.STOPPED:
        checkMessage = 'HTTP API is stopped';
        break;
      case HttpApiState.ERROR:
        switch (this._error) {
          case HttpApiErrorCode.RUN_FAILD:
            checkMessage = `HTTP API is in error state: ${this._errorMsg}`;
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
   * Initializes the HTTP API server.
   * @private
   */
  _init() {
    const { httpApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = httpApi;

    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(this._httpRecorderMiddle);
    app.use(this._httpVerityMiddle);

    routes.forEach((route) => {
      if (route.method === 'get') {
        app.get(route.path, route.handler);
      } else if (route.method === 'post') {
        app.post(route.path, route.handler);
      }
    });

    app.use(this._httpErrorMiddle);

    this._server = http.createServer(app);
    this._httpServerEvents();

    this._wss = new WebSocketServer({
      server: this._server
    });

    this._wss.on('connection', this._websocketServerConnectionEvent.bind(this));
  }

  /**
   * Handles a WebSocket connection.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {http.IncomingMessage} req - The HTTP request object.
   * @private
   */
  _websocketServerConnectionEvent(ws, req) {
    try {
      if (!this._wssVerifyClient(ws, req)) {
        return;
      }

      logger.info(`WebSocket Client connected, total clients: ${this._wss.clients.size}`);

      ws.send('Welcome to the blikvm server!');

      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const ret = createApiObj();
          ret.data.type = 'heartbeat';
          ret.data.timestamp = new Date().toISOString();
          ret.data.serverStatus = this._state;
          ws.send(JSON.stringify(ret));
        }
      }, 2000);

      ws.on('message', (message) => {
        const obj = JSON.parse(message);
        const keys = Object.keys(obj);
        if (keys.includes('m')) {
          handleMouse(obj.m);
        } else if (keys.includes('k')) {
          handleKeyboard(obj.k);
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeatInterval);
        logger.info(`WebSocket Client disconnected, total clients: ${this._wss.clients.size}`);
      });
    } catch (err) {
      logger.error(`Error handling Websocket request: ${err.message}`);
      const ret = createApiObj();
      ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
      ret.msg = err.message;
      ws.send(JSON.stringify(ret));
      ws.close();
    }
  }

  /**
   * Verifies the client connection by checking the provided key and OTP in the request headers.
   * If the key or OTP is missing or incorrect, it sends an error message to the client and closes the connection.
   * @param {WebSocket} ws - The WebSocket connection object.
   * @param {http.IncomingMessage} req - The HTTP request object.
   * @returns {boolean} - Returns true if the client is verified, otherwise false.
   * @private
   */
  _wssVerifyClient(ws, req) {
    const { headers } = req;
    const key = headers.key;
    const otp = headers.otp;
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    if (key && key === data.key) {
      return true;
    } else if (otp && otp === data.otp) {
      return true;
    } else {
      const ret = createApiObj();
      ret.code = ApiErrorCode.INVALID_KEY_OR_OTP;
      ret.msg = 'Key or OTP is missing or wrong';
      ws.send(JSON.stringify(ret));
      ws.close();
      return false;
    }
  }

  /**
   * Handles server errors and sets the appropriate state, error code, and error message.
   * @private
   */
  _httpServerEvents() {
    this._server.on('error', (error) => {
      switch (error.code) {
        case 'EACCES':
          this._state = HttpApiState.ERROR;
          this._error = HttpApiErrorCode.RUN_FAILD;
          this._errorMsg = 'Permission denied to access port';
          break;
        case 'EADDRINUSE':
          this._state = HttpApiState.ERROR;
          this._error = HttpApiErrorCode.RUN_FAILD;
          this._errorMsg = 'Port is already in use.';
          break;
      }
      logger.error(`Http Api error: ${error.message}`);
    });
  }

  /**
   * Records HTTP requests and logs them using the logger.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpRecorderMiddle(req, res, next) {
    const requestType = req.method;
    const requestUrl = req.url;
    logger.info(`http api request ${requestType} ${requestUrl}`);
    next();
  }

  /**
   * Verifies the key or OTP provided in the request body against the stored data.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpVerityMiddle(req, res, next) {
    const ret = createApiObj();
    const key = req.body.key;
    const otp = req.body.otp;
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    if (key && key === data.key) {
      next();
    } else if (otp && otp === data.otp) {
      next();
    } else {
      ret.code = ApiErrorCode.INVALID_KEY_OR_OTP;
      ret.msg = 'Key or OTP is missing or wrong';
      res.status(400).json(ret);
    }
  }

  /**
   * Handles HTTP errors and sends an error response with status code 500.
   * @param {Error} err - The error object.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpErrorMiddle(err, req, res, next) {
    logger.error(`Error handling HTTP request: ${err.message}`);
    const ret = createApiObj();
    ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
    ret.msg = err.message;
    res.status(500).json(ret);
  }
}
export default HttpApi;
export { HttpApiState };
