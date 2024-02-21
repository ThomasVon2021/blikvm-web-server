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
    RUNNING: 'RUNNING',
    STOPPED: 'STOPPED',
};

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
    /**
     * The port number on which the HTTP server is listening.
     * @type {number}
     * @private
     */
    _listenPort = 0;
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
            this._server.listen(this._listenPort, () => {
                this._state=HttpServerState.RUNNING;
                resolve({ name: this.name, port: this._listenPort });
            });
        });
    }

    /**
     * Closes the HTTP server.
     * @returns {Promise<{ name: string, port: number }>} A promise that resolves with the server name and port.
     */
    closeService() {
        return new Promise((resolve, reject) => {
            this._server.close(() => {
                this._state=HttpServerState.STOPPED;
                resolve({ name: this.name, port: this._listenPort });
            });
        });
    }

    /**
     * Initializes the HTTP server.
     * @private
     */
    _init() {
        const { httpServer } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._listenPort = httpServer.port;

        const app = express();

        app.use(cors());
        app.use(bodyParser.json());
        app.use(this._requestRecorder);
        app.use(this._check);

        routes.forEach((route) => {
            if (route.method === "get") {
                app.get(route.path, route.handler);
            } else if (route.method === "post") {
                app.post(route.path, route.handler);
            }
        });

        this._server = http.createServer(app);
        
    }

    /**
     * Middleware function to record HTTP requests.
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object.
     * @param {Function} next - The next middleware function.
     * @private
     */
    _requestRecorder(req, res, next) {
        const requestType = req.method;
        const requestUrl = req.url;

        logger.info(`request ${requestType} ${requestUrl}`);
        next();
    }

    _check(req, res, next) {
        const key = req.body.key
        if (key) {
            const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
            const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
            if(key===data.key){
                next();
            }else{
                res.json({msg: 'key is invalid'});
            }
        }else{
            res.json({msg: 'key is required'});
        }
    }
}

export default HttpServer;
export { HttpServerState };