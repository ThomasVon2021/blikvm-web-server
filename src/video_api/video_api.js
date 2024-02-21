
class ViedoApi {

    static _instance = null;

    _name = "video_api";

    constructor() {
        if (!ViedoApi._instance) {
            ViedoApi._instance = this;
            this._init();
        }

        return ViedoApi._instance;
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

export default ViedoApi;