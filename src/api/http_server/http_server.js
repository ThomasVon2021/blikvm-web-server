/**
 * This module defines the HTTP server class that starts and stops the HTTP server.
 * @module api/http_server/http_server
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from '../../log/logger.js';
import fs from 'fs';
import routes from './api/routes.js';
import { ApiErrorCode, createApiObj } from '../common/api.js';

const logger = new Logger();

/**
 * Represents the state of an HTTP server.
 * @enum {string}
 */
const HttpServerState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

/**
 * Represents an HTTP server.
 * @class
 * @property {HttpServerState} state - The state of the HTTP server.
 */
class HttpServer {
  /**
   * Represents the singleton instance of the HTTP server.
   * @type {HttpServer}
   * @private
   */
  static _instance = null;

  /**
   * Represents the HTTP server instance.
   * @type {Server<Request, Response>}
   * @private
   */
  _server = null;

  /**
   * The name of the HTTP server.
   * @type {string}
   * @private
   */
  _name = 'http_server';

  /**
   * Represents the options for the HTTP server.
   * @type {Object}
   * @private
   */
  _option = null;

  /**
   * Represents the state of the HTTP server.
   * @type {HttpServerState}
   * @private
   */
  _state = HttpServerState.STOPPED;

  /**
   * Logger constructor.
   * @constructor
   */
  constructor() {
    if (!HttpServer._instance) {
      HttpServer._instance = this;
      this._init();
    }

    return HttpServer._instance;
  }

  /**
   * Gets the state of the HTTP server.
   * @returns {HttpServerState} The state of the HTTP server.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Represents the state of the HTTP server.
   * @type {HttpServerState}
   * @private
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the HTTP server.
   * @returns {Promise<Object>} A promise that resolves with the server name, port, and message.
   * @property {string} name - The name of the server.
   * @property {number} port - The port of the server.
   * @property {string} msg - The message of the server.
   */
  startService() {
    return new Promise((resolve, reject) => {
      this._state = HttpServerState.STARTING;
      this._server.listen(this._option.port, () => {
        this._state = HttpServerState.RUNNING;
        logger.info(
          `Http Server started at http://localhost:${this._option.port}, state: ${this._state}`
        );
        resolve({
          name: this.name,
          port: this._option.port,
          msg: ''
        });
      });
    });
  }

  /**
   * Closes the HTTP server.
   * @returns {Promise<Object>} A promise that resolves with the server name, port, and message.
   * @property {string} name - The name of the server.
   * @property {number} port - The port of the server.
   * @property {string} msg - The message of the server.
   */
  closeService() {
    return new Promise((resolve, reject) => {
      this._state = HttpServerState.STOPPING;
      this._server.close(() => {
        this._state = HttpServerState.STOPPED;
        logger.info(
          `Http Api closed at http://localhost:${this._option.port}, state: ${this._state}`
        );
        resolve({
          name: this.name,
          port: this._option.port,
          msg: ''
        });
      });
    });
  }

  /**
   * Initializes the HTTP server.
   * @private
   */
  _init() {
    const { httpServer } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    this._option = httpServer;

    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(this._httpRecorderMiddle);
    app.use(this._httpVerifyMiddle);

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
  }

  /**
   * Handles server errors and throws appropriate errors based on the error code.
   * @private
   */
  _httpServerEvents() {
    this._server.on('error', (error) => {
      switch (error.code) {
        case 'EACCES':
          throw new Error('Permission denied to access port');
        case 'EADDRINUSE':
          throw new Error('Port is already in use');
      }
      logger.error(`Http Api error: ${error.message}`);
    });
  }

  /**
   * Middleware function to record HTTP requests.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpRecorderMiddle(req, res, next) {
    const requestType = req.method;
    const requestUrl = req.url;
    logger.info(`http server request ${requestType} ${requestUrl}`);
    next();
  }

  /**
   * Check if the provided key is valid.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpVerifyMiddle(req, res, next) {
    const ret = createApiObj();
    const key = req.body.key;
    if (key) {
      const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
      const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
      if (key === data.key) {
        next();
      } else {
        ret.code = ApiErrorCode.INVALID_KEY_OR_OTP;
        ret.msg = 'Key is invalid';
        res.status(403).json(ret);
      }
    } else {
      ret.code = ApiErrorCode.INVALID_KEY_OR_OTP;
      ret.msg = 'Key is absent';
      res.status(400).json(ret);
    }
  }

  /**
   * Handles HTTP errors and sends an error response with status code 500.
   *
   * @param {Error} err - The error object.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpErrorMiddle(err, req, res, next) {
    logger.error(`Error handling HTTP request: ${err.message}`);
    const ret = createApiObj();
    ret.code = ApiErrorCode.INTERVAL_SERVER_ERROR;
    ret.msg = err.message;
    res.status(500).json(ret);
  }
}

export default HttpServer;
export { HttpServerState };
