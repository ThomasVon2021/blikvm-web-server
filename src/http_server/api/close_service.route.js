import HttpApi from '../../http_api/http_api.js';
import WebSocketApi from '../../ws_api/ws_api.js';
import VideoApi from '../../video_api/video_api.js';

export default function (req, res) {
    try {
        const httpApi = new HttpApi();
        const webSocketApi = new WebSocketApi();
        const videoApi = new VideoApi();
        Promise.all([httpApi.closeService(), webSocketApi.closeService(), videoApi.closeService()]).then((result) => {
            res.json({ msg: 'Service closed' });
        }).catch((error) => {
            res.json({ msg: `Service failed to close, reason: ${error.message}` });
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}