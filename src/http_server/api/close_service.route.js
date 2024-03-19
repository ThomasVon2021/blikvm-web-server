import HttpApi from '../../http_api/http_api.js';
import VideoApi from '../../video_api/video_api.js';

/**
 * Handles the API request to close the service.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const httpApi = new HttpApi();
    const videoApi = new VideoApi();
    Promise.allSettled([httpApi.closeService(), videoApi.closeService()])
      .then((results) => {
        let successCount = 0;
        const message = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            message[result.value.name] = 'stopped';
          } else {
            message[result.reason.name] = `failed: ${result.reason.msg}`;
          }
        });
        if (successCount > 0) {
          res.json({
            msg: 'Service closed',
            ...message
          });
        } else {
          res.json({
            msg: 'Service failed to close',
            ...message
          });
        }
      })
      .catch((error) => {
        res.json({
          msg: `Service failed to close:${error.message}`
        });
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
