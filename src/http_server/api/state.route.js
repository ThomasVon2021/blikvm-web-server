import HttpServer from "../http_server.js";
import VideoApi from "../../video_api/video_api.js";
import HttpApi from "../../http_api/http_api.js";
import WebSocketApi from "../../ws_api/ws_api.js";
import Logger from "../../log/logger.js";

const logger = new Logger();

function apiFunc (req, res) {
    try {
        const httpServer=new HttpServer();
        const videoApi = new VideoApi();
        const httpApi = new HttpApi();
        const webSocketApi = new WebSocketApi();
        res.json({
            httpServer: httpServer.state,
            videoApi: videoApi.state,
            httpApi: httpApi.state,
            webSocketApi: webSocketApi.state
        });
    } catch (err) {
        logger.error(`Error retrieving state: ${err.message}`);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
}

export default apiFunc;