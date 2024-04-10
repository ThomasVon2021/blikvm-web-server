import Video from '../../modules/video/video.js';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the API request to start the video service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const action = req.query.action;
    const video = new Video();
    if (action === 'start') {
      video
        .startService()
        .then((result) => {
          ret.data.state = video.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = video.state;
          res.json(ret);
        });
    } else if (action === 'stop') {
      video
        .closeService()
        .then((result) => {
          ret.data.state = video.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = video.state;
          res.json(ret);
        });
    } else {
      ret.msg = 'input invalid video command';
      ret.code = ApiErrorCode.INVALID_INPUT_PARAM;
      res.json(ret);
    }
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
