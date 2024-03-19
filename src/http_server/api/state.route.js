import HttpServer from '../http_server.js';
import VideoApi from '../../video_api/video_api.js';
import HttpApi from '../../http_api/http_api.js';

/**
 * Handles the API request and returns the state of various components.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const httpServer = new HttpServer();
    const videoApi = new VideoApi();
    const httpApi = new HttpApi();
    res.json({
      httpServer: httpServer.state,
      videoApi: videoApi.state,
      httpApi: httpApi.state
    });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
