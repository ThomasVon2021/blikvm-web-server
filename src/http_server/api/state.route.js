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
        // const WebSocketApi = new WebSocketApi();
        // logger.info(`Http Api ${HttpApi}`);
        // logger.info(`Http Api ${httpApi}`);
        // logger.info(`Http Api state: ${httpApi.state}`);
        res.json({
            httpServer: httpServer.state,
            videoApi: videoApi.state,
            httpApi: httpApi.state,
            // WebSocketApi: WebSocketApi.state
        });
    } catch (err) {
        logger.error(`Error retrieving state: ${err.message}`);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
}

export default apiFunc;