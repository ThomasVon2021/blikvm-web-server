import HttpApi from '../../http_api/http_api.js';
import VideoApi from '../../video_api/video_api.js';
import { generateSecret } from '../../common/tool.js';
import fs from 'fs';

/**
 * Handles the API request to start the service.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    data.otp = generateSecret(6);
    fs.writeFileSync(other.secretFile, JSON.stringify(data));
    const httpApi = new HttpApi();
    const videoApi = new VideoApi();
    Promise.allSettled([httpApi.startService(), videoApi.startService()])
      .then((results) => {
        let successCount = 0;
        const message = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            message[result.value.name] = 'running';
          } else {
            message[result.reason.name] = `failed: ${result.reason.msg}`;
          }
        });
        if (successCount > 0) {
          res.json({
            otp: data.otp,
            msg: 'Service started',
            ...message
          });
        } else {
          res.json({
            msg: 'Service failed to start',
            ...message
          });
        }
      })
      .catch((error) => {
        res.json({
          msg: `Service failed to start:${error.message}`
        });
      });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
