import fs from 'fs';
import { createApiObj } from '../../common/api.js';

/**
 * Handles the API request and sends the device ID as a response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiFunc(req, res, next) {
  try {
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    const ret = createApiObj();
    ret.data.id = data.id;
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
