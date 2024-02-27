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
};

class HttpApi {

    static _instance = null;

    _name = "http_api";
    _server=null;
    _listenPort=0;
    _state=HttpApi.STOPPED;

    constructor() {
        if (!HttpApi._instance) {
            HttpApi._instance = this;
            this._init();
        }

        return HttpApi._instance;
    }

    startService() {
        return new Promise((resolve, reject) => {
            this._server.listen(this._listenPort, () => {
                this._state=HttpApi.RUNNING;
                resolve({ name: this._name });
            });
        });
    }

    closeService() {
        return new Promise((resolve, reject) => {
            this._server.close(() => {
                this._state=HttpApi.STOPPED;
                resolve({ name: this._name });
            });
        });
    }

    _init() {
        const { httpApi } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        this._listenPort = httpApi.port;

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
        const requestType = req.method;
        const requestUrl = req.url;

        logger.info(`request ${requestType} ${requestUrl}`);
        next();
    }

    _check(req, res, next) {
        next();
    }
}

export default HttpApi;
export {HttpApiState}