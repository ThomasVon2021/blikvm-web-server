import http from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Logger from "../log/logger.js";
import fs from 'fs';
import routes from "./api/routes.js";

const logger = new Logger();

/**
 * Represents the state of an HTTP server.
 * @enum {string}
 * @readonly
 * @property {string} RUNNING - The server is running.
 * @property {string} STOPPED - The server is stopped.
 */
const HttpServerState = {
    STARTING: 'STARTING',
    RUNNING: 'RUNNING',
    STOPPING: 'STOPPING',
    STOPPED: 'STOPPED',
    ERROR: 'ERROR',
}

/**
 * Represents an HTTP server.
 * @class
 */
class HttpServer {

    /**
     * Represents the singleton instance of the HTTP server.
     * @type {null}
     * @private
     */
    static _instance = null;

    /**
     * Represents the HTTP server instance.
     * @type {null}
     */
    _server = null;
    /**
     * The name of the HTTP server.
     * @type {string}
     */
    _name = 'http_server';
    _option = null;
    /**
     * Represents the state of the HTTP server.
     * @type {HttpServerState}
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
     */
    get state() {
        return this._state;
    }
    /**
     * Represents the state of the HTTP server.
     * @type {HttpServerState}
     */
    set state(value) {
        this._state = value;
    }

    /**
     * Starts the HTTP server.
     * @returns {Promise<{ name: string, port: number }>} A promise that resolves with the server name and port.
     */
    startService() {
        return new Promise((resolve, reject) => {
            this._state = HttpServerState.STARTING;
            this._server.listen(this._option.port, () => {
                this._state = HttpServerState.RUNNING;
                logger.info(`Http Server started at http://localhost:${this._option.port}, state: ${this._state}`);
                resolve({
                    name: this.name,
                    port: this._option.port
                });
            });
        });
    }

    /**
     * Closes the HTTP server.
     * @returns {Promise<{ name: string, port: number }>} A promise that resolves with the server name and port.
     */
    closeService() {
        return new Promise((resolve, reject) => {
            this._state = HttpServerState.STOPPING;
            this._server.close(() => {
                this._state = HttpServerState.STOPPED;
                logger.info(`Http Api closed at http://localhost:${this._option.port}, state: ${this._state}`);
                resolve({
                    name: this.name,
                    port: this._option.port
                });
            });
        });
    }

    /**
     * Initializes the HTTP server.
     * @private
     */
    _init() {
        const {
            httpServer
        } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._option = httpServer;

        const app = express();

        app.use(cors());
        app.use(bodyParser.json());
        app.use(this._httpRecorder);
        app.use(this._httpVerity);

        routes.forEach((route) => {
            if (route.method === "get") {
                app.get(route.path, route.handler);
            } else if (route.method === "post") {
                app.post(route.path, route.handler);
            }
        });

        app.use(this._httpError);

        this._server = http.createServer(app);

    }

    /**
     * Middleware function to record HTTP requests.
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object.
     * @param {Function} next - The next middleware function.
     * @private
     */
    _httpRecorder(req, res, next) {
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
     */
    _httpVerity(req, res, next) {
        const key = req.body.key;
        if (key) {
            const {
                other
            } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
            const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
            if (key === data.key) {
                next();
            } else {
                res.status(403).json({
                    msg: 'Key is invalid'
                });
            }
        } else {
            res.status(400).json({
                msg: 'Key is required'
            });
        }
    }

    _httpError(err, req, res, next) {
        logger.error(`Error handling HTTP request: ${err.message}`);
        res.status(500).json({
            msg: 'Internal Server Error'
        });
    }
}

export default HttpServer;
export {
    HttpServerState
};