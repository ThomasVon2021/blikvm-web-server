import http from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Logger from "../log/logger.js";
import fs from 'fs';
import routes from "./api/routes.js";
import {
    WebSocketServer,
    WebSocket
} from 'ws';
import handleMouse from "./mouse.js";
import handleKeyboard from "./keyboard.js";

const logger = new Logger();

const HttpApiState = {
    STARTING: 'STARTING',
    RUNNING: 'RUNNING',
    STOPPING: 'STOPPING',
    STOPPED: 'STOPPED',
    ERROR: 'ERROR',
}


class HttpApi {

    static _instance = null;

    _name = "http_api";
    _server = null;
    _wss = null;
    _option = null;
    _state = HttpApiState.STOPPED;
    _wssClientsNumber = 0;

    constructor() {
        if (!HttpApi._instance) {
            HttpApi._instance = this;
            this._init();
        }

        return HttpApi._instance;
    }

    get state() {
        return this._state;
    }

    set state(value) {
        this._state = value;
    }

    startService() {
        return new Promise((resolve, reject) => {
            this._state = HttpApiState.STARTING;
            this._server.listen(this._option.port, () => {
                this._state = HttpApiState.RUNNING;
                logger.info(`Http Api started at http://localhost:${this._option.port}, state: ${this._state}`);
                logger.info(`WebSocket Api started at ws://localhost:${this._option.port}, state: ${this._state}`);
                resolve({
                    name: this._name,
                    port: this._option.port
                });
            });
        });
    }

    closeService() {
        return new Promise((resolve, reject) => {
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
                        logger.info(`Http Api closed at http://localhost:${this._option.port}, state: ${this._state}`);
                        logger.info(`WebSocket Api closed at ws://localhost:${this._option.port}, state: ${this._state}`);
                        resolve({
                            name: this._name,
                            port: this._option.port
                        });
                    });
                } else {
                    setTimeout(checkClose, 100);
                }
            }

            checkClose();

        });
    }

    _init() {
        const {
            httpApi
        } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._option = httpApi;

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
        this._wss = new WebSocketServer({
            server: this._server
        });

        this._wss.on('connection', this._wssConnection.bind(this));
    }

    _wssConnection(ws, req) {

        try {
            const {
                headers
            } = req;
            const key = headers['key'];
            const otp = headers['otp'];
            const {
                other
            } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
            const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
            if (key && key === data.key) {} else if (otp && otp === data.otp) {} else {
                ws.send('Key or OTP is missing or wrong');
                ws.close();
                return;
            }

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
                if (keys.includes("m")) {
                    handleMouse(obj['m']);
                } else if (keys.includes("k")) {
                    handleKeyboard(obj['k']);
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

    _httpRecorder(req, res, next) {
        const requestType = req.method;
        const requestUrl = req.url;
        logger.info(`http api request ${requestType} ${requestUrl}`);
        next();
    }

    _httpVerity(req, res, next) {
        const key = req.body.key;
        const otp = req.body.otp;
        const {
            other
        } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
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

    _httpError(err, req, res, next) {
        logger.error(`Error handling HTTP request: ${err.message}`);
        res.status(500).json({
            msg: 'Internal Server Error'
        });
    }
    
}
export default HttpApi;
export {
    HttpApiState
}