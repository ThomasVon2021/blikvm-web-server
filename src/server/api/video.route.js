import Video from '../../modules/video/video.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';

const logger = new Logger();
/**
 * Handles the API request to start the video service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiVideoControl(req, res, next) {
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
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
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
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = video.state;
          res.json(ret);
        });
    } else {
      ret.msg = 'input invalid video command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(ret);
    }
  } catch (err) {
    next(err);
  }
}

// 
function apiVideoConfig(req, res, next){
  try {
    const ret = createApiObj();
    const video = new Video();
    const action = req.query.action;
    if(action === 'get'){
      ret.data =  video.getVideoConfig();
      ret.msg = 'get video param success';
    } else if( action === 'set'){
      video.setVideoConfig(req.body.data);
      ret.msg = 'set video param success';
    } else{
      ret.msg = 'input invalid video command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
    }
    res.json(ret);
  } catch (error) {
    next(err);
  }
}

export {apiVideoControl, apiVideoConfig};
