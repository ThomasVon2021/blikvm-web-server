/**
 * This module defines the HTTP and WebSocket API server.
 * @module api/http_api/http_api
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from '../log/logger.js';
import fs from 'fs';
import routes from './api/routes.js';
import { WebSocketServer, WebSocket } from 'ws';
import Mouse from './mouse.js';
import Keyboard from './keyboard.js';
import { ApiCode, createApiObj } from '../common/api.js';
import {CONFIG_PATH, UTF8, JWT_SECRET} from "../common/constants.js"
import { fileExists } from "../common/tool.js"
import path from 'path';
import { apiLogin } from "./api/login.route.js"
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import HID from '../modules/kvmd/kvmd_hid.js';


const logger = new Logger();

/**
 * Represents the state of the HTTP API.
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
 * Represents an HTTP API server.
 * @class
 * @property {HttpServerState} state - The state of the HTTP API.
 */
class HttpServer {
  /**
   * Represents the singleton instance of the HttpServer class.
   * @type {HttpServer}
   * @private
   */
  static _instance = null;

  /**
   * The name of the HTTP API.
   * @type {string}
   * @private
   */
  _name = 'httpServer';

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
   * Represents the state of the HttpServer.
   * @type {HttpServerState}
   * @private
   */
  _state = HttpServerState.STOPPED;

  /**
   * Represents the HttpServer class.
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
   * Get the state of the HTTP API.
   * @returns {HttpServerState} The state of the HTTP API.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   * @param {HttpServerState} value - The new value for the state.
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
      this._state = HttpServerState.STARTING;
      this._server.listen(this._option.port, () => {
        this._state = HttpServerState.RUNNING;
        logger.info(
          `Http Api started at http://localhost:${this._option.port}, state: ${this._state}`
        );
        logger.info(
          `WebSocket Api started at ws://localhost:${this._option.port}, state: ${this._state}`
        );
        resolve('ok');
      });
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
      this._state = HttpServerState.STOPPING;

      const wsClientNumber = this._wss.clients.size;
      this._wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      const checkClose = () => {
        if (wsClientNumber <= 0) {
          this._server.close(() => {
            this._state = HttpServerState.STOPPED;
            logger.info(
              `Http Api closed at http://localhost:${this._option.port}, state: ${this._state}`
            );
            logger.info(
              `WebSocket Api closed at ws://localhost:${this._option.port}, state: ${this._state}`
            );
            resolve('ok');
          });
        } else {
          setTimeout(checkClose, 100);
        }
      };

      checkClose();
    });
  }

  _getRootPath() {
    let root_path;
    if(process.env.NODE_ENV === 'development'){
      const { server } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      root_path = server.rootPath;
    }else{
      root_path = __dirname;
    }
    return root_path;
  }

  /**
   * Initializes the HTTP API server.
   * @private
   */
  _init() {
    const { server } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._option = server;

    const app = express();
    app.use(cors({
      origin: true,
      credentials: true
    }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(this._getRootPath(), 'dist')));
    app.post('/api/login', apiLogin);
    app.use(this._httpVerityMiddle);
    app.use(this._httpRecorderMiddle);
    routes.forEach((route) => {
      if (route.method === 'get') {
        app.get(route.path, route.handler);
      } else if (route.method === 'post') {
        app.post(route.path, route.handler);
      }
    });

    app.use(this._httpErrorMiddle);


    
    app.get("*", this._otherRoute);

    this._server = http.createServer(app);
    this._httpServerEvents();

    this._wss = new WebSocketServer({
      server: this._server
    });

    this._wss.on('connection', this._websocketServerConnectionEvent.bind(this));
  }

  _otherRoute(req, res) {
    try {
      const distDir = `${this._getRootPath()}/dist`;
      if (req.url === "/") {
        res.sendFile(`${distDir}/index.html`);
        return;
      }
      const path = distDir + req.url;
      if (fileExists(path)) {
        logger.info(`path:${path}`);
        res.sendFile(path);
      } else {
        res.sendFile(`${distDir}/index.html`);
      }
    } catch (err) {
      logger.error(`route[*]: ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Handles a WebSocket connection.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {http.IncomingMessage} req - The HTTP request object.
   * @private
   */
  _websocketServerConnectionEvent(ws, req) {
    try {
      // if (!this._wssVerifyClient(ws, req)) {
      //   return;
      // }

      logger.info(`WebSocket Client connected, total clients: ${this._wss.clients.size}`);

      const mouse = new Mouse();
      const keyboard = new Keyboard();
      const hid = new HID();
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const ret = createApiObj();
          ret.data.type = 'heartbeat';
          ret.data.timestamp = new Date().toISOString();
          ret.data.serverStatus = this._state;
          ret.data.mouseStatus = mouse.getStatus();
          ret.data.keyboardStatus = keyboard.getStatus();
          ret.data.hidStatus = hid.getStatus();
          ws.send(JSON.stringify(ret));
        }
      }, 2000);

      ws.on('message', (message) => {
        const obj = JSON.parse(message);
        const keys = Object.keys(obj);
        if (keys.includes('m')) {
          mouse.handleEvent(obj.m);
        } else if (keys.includes('k')) {
          keyboard.handleEvent(obj.k);
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeatInterval);
        logger.info(`WebSocket Client disconnected, total clients: ${this._wss.clients.size}`);
      });
    } catch (err) {
      logger.error(`Error handling Websocket request: ${err.message}`);
      const ret = createApiObj();
      ret.code = ApiCode.INTERNAL_SERVER_ERROR;
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
    const user = headers.user;
    const pwd = headers.pwd;
    const { firmwareObject } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const data = JSON.parse(fs.readFileSync(firmwareObject.firmwareFile, UTF8));
    if (user && user === data.user && pwd && pwd === data.pwd) {
      return true;
    } else {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_CREDENTIALS;
      ret.msg = 'user or pwd is missing or wrong';
      ws.send(JSON.stringify(ret));
      ws.close();
      logger.error("user or pwd is missing or wrong");
      return false;
    }
  }

  /**
   * Handles server errors and sets the appropriate state, error code, and error message.
   * @private
   */
  _httpServerEvents() {
    this._server.on('error', (error) => {
      logger.error(`Http Server error: ${error.message}`);
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const username = decoded.username;
    logger.info(`http api request ${requestType} ${requestUrl} by ${username}`);
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
    const returnObject = createApiObj();
    returnObject.code = ApiCode.INVALID_CREDENTIALS;

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token){
      logger.error('token is null');
      returnObject.msg = 'token is null!';
      res.status(401).json(returnObject);
      return; 
    } 
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err){
        logger.error('token is error');
        returnObject.msg = 'token is error!';
        res.status(401).json(returnObject);
        return;
      } 
      next();
    });
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
    logger.error(`Error handling HTTP request: ${err}`);
    const ret = createApiObj();
    ret.code = ApiCode.INTERNAL_SERVER_ERROR;
    ret.msg = err.message;
    res.status(500).json(ret);
  }
}
export default HttpServer;
export { HttpServerState };
