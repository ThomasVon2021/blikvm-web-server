import fs from 'fs';

/**
 * Handles the API request and sends the device ID as a response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function apiFunc(req, res, next) {
  try {
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
    res.json({
      id: data.id
    });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
