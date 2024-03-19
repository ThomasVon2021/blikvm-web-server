import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from '../log/logger.js';
import fs from 'fs';
import routes from './api/routes.js';
import { WebSocketServer, WebSocket } from 'ws';
import handleMouse from './mouse.js';
import handleKeyboard from './keyboard.js';

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
 */
const ErrorCode = {
  OK: 'OK',
  RUN_FAILD: 'RUN_FAILD'
};

/**
 * Represents an HTTP API server.
 * @class
 */
class HttpApi {
  /**
   * Represents the singleton instance of the HttpApi class.
   * @type {HttpApi|null}
   * @private
   */
  static _instance = null;

  /**
   * The name of the HTTP API.
   * @type {string}
   */
  _name = 'http_api';

  /**
   * Represents the server instance.
   * @type {Object|null}
   * @private
   */
  _server = null;

  /**
   * WebSocket server instance.
   * @type {WebSocketServer|null}
   */
  _wss = null;

  /**
   * Represents the options for the HTTP API.
   * @type {null}
   */
  _option = null;

  /**
   * Represents the state of the HttpApi.
   * @type {HttpApiState}
   * @private
   */
  _state = HttpApiState.STOPPED;

  /**
   * Number of WebSocket clients connected.
   * @type {number}
   */
  _wssClientsNumber = 0;

  /**
   * Represents the error code.
   * @type {number}
   */
  _error = ErrorCode.OK;

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
   *
   * @returns {string} The state of the HTTP API.
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
   * Starts the HTTP service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @throws {Object} If the service fails to start, the promise will be rejected with an object containing the service name, port, and error message.
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

      if (this._state === HttpApiState.RUNNING) {
        resolve(result);
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
        if (this._error === ErrorCode.RUN_FAILD) {
          result.msg = this._errorMsg;
          reject(result);
        }
      }, 500);

      startServer();
    });
  }

  /**
   * Closes the HTTP API service.
   * @returns {Promise<Object>} A promise that resolves with the result object when the service is closed successfully, or rejects with the result object if there is an error.
   */
  closeService() {
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

      if (this._state === HttpApiState.STOPPED) {
        resolve(result);
        return;
      }

      this._state = HttpApiState.STOPPING;

      this._wssClientsNumber = this._wss.clients.size;
      this._wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      const checkClose = () => {
        if (this._wssClientsNumber <= 0) {
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
   */
  _startServiceStateCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case HttpApiState.STARTING:
        checkMessage = 'HTTP API is starting, please wait.';
        break;
      case HttpApiState.RUNNING:
        checkResult = true;
        checkMessage = 'HTTP API is running.';
        break;
      case HttpApiState.STOPPING:
        checkMessage = 'HTTP API is stopping, please wait.';
        break;
      case HttpApiState.STOPPED:
        checkResult = true;
        checkMessage = 'HTTP API is stopped.';
        break;
      case HttpApiState.ERROR:
        switch (this._error) {
          case ErrorCode.RUN_FAILD:
            checkResult = true;
            checkMessage = this._errorMsg;
            break;
          default:
            checkMessage = 'Video Error is unknown.';
            break;
        }
        break;
      default:
        checkMessage = 'HTTP API state is unknown.';
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
   */
  _closeServiceStateCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case HttpApiState.STARTING:
        checkMessage = 'HTTP API is starting, please wait.';
        break;
      case HttpApiState.RUNNING:
        checkResult = true;
        checkMessage = 'HTTP API is running.';
        break;
      case HttpApiState.STOPPING:
        checkMessage = 'HTTP API is stopping, please wait.';
        break;
      case HttpApiState.STOPPED:
        checkResult = true;
        checkMessage = 'HTTP API is stopped';
        break;
      case HttpApiState.ERROR:
        switch (this._error) {
          case ErrorCode.RUN_FAILD:
            checkMessage = this._errorMsg;
            break;
          default:
            checkMessage = 'Video Error is unknown.';
            break;
        }
        break;
      default:
        checkMessage = 'HTTP API state is unknown.';
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  /**
   * Initializes the HTTP API server.
   * Reads the configuration from 'config/app.json' file,
   * sets up the Express app, adds middleware, defines routes,
   * creates an HTTP server, and sets up a WebSocket server.
   */
  _init() {
    const { httpApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = httpApi;

    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(this._httpRecorder);
    app.use(this._httpVerity);

    routes.forEach((route) => {
      if (route.method === 'get') {
        app.get(route.path, route.handler);
      } else if (route.method === 'post') {
        app.post(route.path, route.handler);
      }
    });

    app.use(this._httpError);

    this._server = http.createServer(app);
    this._handleServerError();

    this._wss = new WebSocketServer({
      server: this._server
    });

    this._wss.on('connection', this._wssHandleConnection.bind(this));
  }

  /**
   * Handles a WebSocket connection.
   *
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {http.IncomingMessage} req - The HTTP request object.
   * @returns {void}
   */
  _wssHandleConnection(ws, req) {
    try {
      // const {
      //     headers
      // } = req;
      // const key = headers['key'];
      // const otp = headers['otp'];
      // const {
      //     other
      // } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
      // const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
      // if (key && key === data.key) {} else if (otp && otp === data.otp) {} else {
      //     ws.send('Key or OTP is missing or wrong');
      //     ws.close();
      //     return;
      // }

      logger.info(`Client connected, total clients: ${this._wss.clients.size}`);

      ws.send('Welcome to the blikvm server!');

      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const heartbeatMessage = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            serverStatus: 'OK'
          };
          ws.send(JSON.stringify(heartbeatMessage));
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
        this._wssClientsNumber--;
        clearInterval(heartbeatInterval);
        logger.info(`Client disconnected, total clients: ${this._wss.clients.size}`);
      });
    } catch (err) {
      logger.error(`Error handling Websocket request: ${err.message}`);
      ws.send('Internal Server Error');
      ws.close();
    }
  }

  /**
   * Handles server errors and sets the appropriate state, error code, and error message.
   * @private
   */
  _handleServerError() {
    this._server.on('error', (error) => {
      switch (error.code) {
        case 'EACCES':
          this._state = HttpApiState.ERROR;
          this._error = ErrorCode.RUN_FAILD;
          this._errorMsg = 'Permission denied to access port';
          break;
        case 'EADDRINUSE':
          this._state = HttpApiState.ERROR;
          this._error = ErrorCode.RUN_FAILD;
          this._errorMsg = 'Port is already in use.';
          break;
      }
      logger.error(`Http Api error: ${error.message}`);
    });
  }

  /**
   * Records HTTP requests and logs them using the logger.
   *
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   */
  _httpRecorder(req, res, next) {
    const requestType = req.method;
    const requestUrl = req.url;
    logger.info(`http api request ${requestType} ${requestUrl}`);
    next();
  }

  /**
   * Verifies the key or OTP provided in the request body against the stored data.
   * If the verification is successful, calls the next middleware function.
   * Otherwise, sends a response with a 400 status code and an error message.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  _httpVerity(req, res, next) {
    const key = req.body.key;
    const otp = req.body.otp;
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    if (key && key === data.key) {
      next();
    } else if (otp && otp === data.otp) {
      next();
    } else {
      res.status(400).json({
        msg: 'Key or OTP is missing or wrong'
      });
    }
  }

  /**
   * Handles HTTP errors and sends an error response with status code 500.
   *
   * @param {Error} err - The error object.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   */
  _httpError(err, req, res, next) {
    logger.error(`Error handling HTTP request: ${err.message}`);
    res.status(500).json({
      msg: 'Internal Server Error'
    });
  }
}
export default HttpApi;
export { HttpApiState };
