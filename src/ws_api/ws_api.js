import fs from 'fs';
import {WebSocketServer} from 'ws';
import Logger from "../log/logger.js";
import handleMouse from "./api/mouse.js";
import handleKeyboard from "./api/keyboard.js";

const logger=new Logger();

const WebSocketState = {
    RUNNING: 'RUNNING',
    STOPPED: 'STOPPED',
    STARTING: 'STARTING',
    STOPPING: 'STOPPING',
    PAUSED: 'PAUSED',
    ERROR: 'ERROR',
    UNKNOWN: 'UNKNOWN'
  }

class WebSocketApi {

    static _instance = null;

    _name = "websocket_api";
    _option=null;
    _wss=null;
    _state=WebSocketState.STOPPED;

    constructor() {
        if (!WebSocketApi._instance) {
            WebSocketApi._instance = this;
            this._init();
        }

        return WebSocketApi._instance;
    }

    get state() {
        return this._state;
    }

    set state(value) {
        this._state = value;
    }

    startService() {
        return new Promise((resolve, reject) => {
            this._wss = new WebSocketServer({ port: this._option.port });
            this._state=WebSocketState.STARTING;

            this._wss.on('connection', (ws) => {

                logger.info('Client connected');
                ws.send('Welcome to the WebSocket server!');

                // const heartbeatInterval = setInterval(() => {
                //     if (ws.readyState === ws.OPEN) {
                //         ws.send('heartbeat');
                //     }
                // }, 2000);

                ws.on('message', (message) => {
                    // logger.info(`Received message => ${message}`);
                    const obj = JSON.parse(message);
                    const keys = Object.keys(obj);
                    if (keys.includes("m")) {
                        handleMouse(obj['m'])
                    } else if (keys.includes("k")) {
                        logger.info(`Received message => ${message}`);
                        handleKeyboard(obj['k'])
                    }
                });

                ws.on('close', () => {
                    logger.info('Client disconnected');
                    // clearInterval(heartbeatInterval);
                });
           });

            this._wss.on('listening', () => {
                this._state=WebSocketState.RUNNING;
                logger.info(`WebSocket server started on ws://localhost:${this._option.port}`);
                resolve({ name: this._name,port:this._option.port });
            });
        });
    }

    closeService() {
        return new Promise((resolve, reject) => {
            this._state=WebSocketState.STOPPING;
            this._wss.close(() => {
                this._state=WebSocketState.STOPPED;
                logger.info('WebSocket server closed');
                resolve({ name: this._name,port:this._option.port });
            });
        });
    }

    _init() {
        const {wsApi}=JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._option=wsApi;
    }
}

export default WebSocketApi;
export {
    WebSocketState
};