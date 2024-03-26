import HttpApi from '../../http_api/http_api.js';
import VideoApi from '../../video_api/video_api.js';
import { generateSecret } from '../../../common/tool.js';
import fs from 'fs';
import { ApiErrorCode, createApiObj } from '../../common/api.js';

/**
 * Handles the API request to start the service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const otp = generateOTP();
    const ret = createApiObj();
    const httpApi = new HttpApi();
    const videoApi = new VideoApi();
    Promise.allSettled([httpApi.startService(), videoApi.startService()])
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
          ret.msg = `${successCount} services started successfully`;
          ret.data.state = { httpApi: httpApi.state, videoApi: videoApi.state };
          ret.data.otp = otp;
          ret.data.reason = reason;
          res.json(ret);
        } else {
          ret.code = ApiErrorCode.INTERVAEL_SERVER_ERROR;
          ret.msg = 'no service started successfully';
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

/**
 * Generates a one-time password (OTP) and updates the secret file with the new OTP.
 * @returns {string} The generated OTP.
 * @private
 */
function generateOTP() {
  const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
  const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
  data.otp = generateSecret(6);
  fs.writeFileSync(other.secretFile, JSON.stringify(data));
  return data.otp;
}

export default apiFunc;
