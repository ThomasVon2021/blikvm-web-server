import Video from '../../modules/video/video.js';
import KVMDMain from '../../modules/kvmd/kvmd-main.js';
import { createApiObj } from '../../common/api.js';

/**
 * Handles the API request to get the video kvmd-main service state.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const video = new Video();
    ret.data.video = video.state;
    const kvmdmain = new KVMDMain();
    ret.data.kvmdmain = kvmdmain.state;
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
