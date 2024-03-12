import VideoApi from '../../video_api/video_api.js';

/**
 * Handles the API request to close the video service.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
    try {
        const videoApi = new VideoApi();

        videoApi.closeService().then((result => {
            res.json({
                msg: 'successful'
            })
        })).catch((result) => {
            res.json({
                msg: `failed: ${result.msg}`
            })
        });
    } catch (err) {
        next(err);
    }
}

export default apiFunc;