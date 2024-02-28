import http from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Logger from "../log/logger.js";
import fs from 'fs';
import routes from "./api/routes.js";

const logger = new Logger();

const HttpApiState = {
    RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN'
};

class HttpApi {

    static _instance = null;

    _name = "http_api";
    _server=null;
    _option=null;
    _state=HttpApiState.STOPPED;

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
            this._state=HttpApiState.STARTING;
            this._server.listen(this._option.port, () => {
                this._state=HttpApiState.RUNNING;
                logger.info(`Http Api started at ${this._option.port}, state: ${this._state}`);
                resolve({ name: this._name,port:this._option.port });
            });
        });
    }

    closeService() {
        return new Promise((resolve, reject) => {
            this._state=HttpApiState.STOPPING;
            this._server.close(() => {
                this._state=HttpApiState.STOPPED;
                resolve({ name: this._name,port:this._option.port });
            });
        });
    }

    _init() {
        const { httpApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._option = httpApi;

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

    _requestRecorder(req, res, next) {
        try {
            const requestType = req.method;
            const requestUrl = req.url;
            logger.info(`http api request ${requestType} ${requestUrl}`);
            next();
        } catch (err) {
            logger.error(`Error recording HTTP request: ${err.message}`);
            res.status(500).json({ msg: 'Internal Server Error' });
        }
    }

    _check(req, res, next) {
        try {
            const key = req.body.key;
            const otp=req.body.otp;
            const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
            const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
            if (key&&key === data.key) {
                next();
            }
            else if(otp&&otp === data.otp){
                next();
            }
            else {
                res.status(400).json({ msg: 'Key or OTP is missing or wrong' });
            }
        } catch (err) {
            logger.error(`Error checking key: ${err.message}`);
            res.status(500).json({ msg: 'Internal Server Error' });
        }
    }
}

export default HttpApi;
export {HttpApiState}