import HttpApi from '../../http_api/http_api.js';
import VideoApi from '../../video_api/video_api.js';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the API request to close the service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const httpApi = new HttpApi();
    const videoApi = new VideoApi();
    Promise.allSettled([httpApi.closeService(), videoApi.closeService()])
      .then((results) => {
        let successCount = 0;
        const reason = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            successCount++;
            reason[result.value.name] = '';
          } else {
            reason[result.reason.name] = result.reason.msg;
          }
        });
        if (successCount > 0) {
          ret.code = ApiErrorCode.OK;
          ret.msg = `${successCount} services closed successfully`;
          ret.data.state = { httpApi: httpApi.state, videoApi: videoApi.state };
          ret.data.reason = reason;
          res.json(ret);
        } else {
          ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
          ret.msg = 'no service closed successfully';
          ret.data.state = { httpApi: httpApi.state, videoApi: videoApi.state };
          ret.data.reason = reason;
          res.json(ret);
        }
      })
      .catch((error) => {
        ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
        ret.msg = error.message;
        ret.data.state = { httpApi: httpApi.state, videoApi: videoApi.state };
        res.json(ret);
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
