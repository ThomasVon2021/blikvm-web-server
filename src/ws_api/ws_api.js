
class WebSocketApi {

    static _instance = null;

    _name = "websocket_api";

    constructor() {
        if (!WebSocketApi._instance) {
            WebSocketApi._instance = this;
            this._init();
        }

        return WebSocketApi._instance;
    }

    startService() {
        return new Promise((resolve, reject) => {
            resolve({ name: this._name });
        });
    }

    closeService() {
        return new Promise((resolve, reject) => {
            resolve({ name: this._name });
        });
    }

    _init() {

    }
}

export default WebSocketApi;