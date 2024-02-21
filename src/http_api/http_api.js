
class HttpApi {

    static _instance = null;

    _name = "http_api";

    constructor() {
        if (!HttpApi._instance) {
            HttpApi._instance = this;
            this._init();
        }

        return HttpApi._instance;
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

export default HttpApi;