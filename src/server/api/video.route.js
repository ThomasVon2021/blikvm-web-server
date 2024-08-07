
/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/
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

function apiVideoConfig(req, res, next) {
  try {
    const ret = createApiObj();
    const video = new Video();
    const action = req.query.action;
    if (action === 'get') {
      ret.data = video.getVideoConfig();
      ret.msg = 'get video param success';
    } else if (action === 'set') {
      video.setVideoConfig(req.body.data);
      ret.msg = 'set video param success';
    } else {
      ret.msg = 'input invalid video command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
    }
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

function apiGetVideoState(req, res, next) {
  const ret = createApiObj();
  const video = new Video();
  video.getVideoState()
    .then(response => {
      ret.msg = 'get video state ok';
      ret.data = {
        width: response.result.source.resolution.width,
        height: response.result.source.resolution.height,
        capturedFps: response.result.source.captured_fps,
        queuedFps: response.result.stream.queued_fps
      };
      res.json(ret);
    })
    .catch(error => {
      next(error);
    });
}

async function wsGetVideoState() {
  try {
    const response = await new Video().getVideoState();
    const ret = {
      width: response.result.source.resolution.width,
      height: response.result.source.resolution.height,
      capturedFps: response.result.source.captured_fps,
      queuedFps: response.result.stream.queued_fps
    };
    return ret;
  } catch (error) {
    logger.error(`get video state error: ${error}`);
  }
}

export { apiVideoControl, apiVideoConfig, apiGetVideoState, wsGetVideoState };
