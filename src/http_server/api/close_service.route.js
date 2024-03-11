import HttpApi from '../../http_api/http_api.js';
import VideoApi from '../../video_api/video_api.js';

/**
 * Handles the API request to close the service.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
function apiFunc(req, res, next) {
    try {
        const httpApi = new HttpApi();
        const videoApi = new VideoApi();
        Promise.all([httpApi.closeService(), videoApi.closeService()]).then((result) => {
            res.json({
                msg: 'Service closed'
            });
        }).catch((error) => {
            res.json({
                msg: `Service failed to close, reason: ${error.message}`
            });
        });
    } catch (err) {
        next(err);
    }
}

export default apiFunc;