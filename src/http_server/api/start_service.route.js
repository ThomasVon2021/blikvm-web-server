import HttpApi from '../../http_api/http_api.js';
import WebSocketApi from '../../ws_api/ws_api.js';
import VideoApi from '../../video_api/video_api.js';
import {generateSecret} from '../../common/tool.js';
import Logger from '../../log/logger.js';
import fs from 'fs';

const logger = new Logger();

/**
 * Handles the API request to start the service.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
function apiFunc (req, res) {
    try {
        const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
        data.otp=generateSecret(6);
        fs.writeFileSync(other.secretFile,JSON.stringify(data));
        const httpApi = new HttpApi();
        const webSocketApi = new WebSocketApi();
        const videoApi = new VideoApi();
        Promise.all([httpApi.startService(), webSocketApi.startService(), videoApi.startService()]).then((result) => {
            res.json({ otp:data.otp,msg: 'Service started' });
        }).catch((error) => {
            res.json({ msg: `Service failed to start, reason: ${error.message}` });
        });
    } catch (err) {
        logger.error(`Error starting service: ${err.message}`);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
}

export default apiFunc;