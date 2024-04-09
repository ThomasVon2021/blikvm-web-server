import { createSocket } from 'unix-dgram';
import { createApiObj, ApiErrorCode } from '../../common/api.js';
import fs from 'fs';

/**
 * Handles ATX API request.
 *
 * @param {Object} req - The request object, cmd(power):power on/off, cmd(forcepower):force power on/off, cmd(reboot):reboot.
 * like: curl -X POST -k -u admin:admin http://ip:port/atx/click?button=power
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the API request is handled.
 * @throws {Error} - If there is an error while handling the API request.
 */
function apiFunc(req, res, next) {
  try {
    const ret = createApiObj();
    const cmd = req.query.button;
    switch (cmd) {
      case 'power':
        writeToSocket(128)
          .then(() => {
            ret.msg = 'power on/off';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiErrorCode.INVALID_INPUT_PARA;
            res.json(ret);
          });
        break;
      case 'forcepower':
        writeToSocket(192)
          .then(() => {
            ret.msg = 'force power on/off';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiErrorCode.INVALID_INPUT_PARA;
            res.json(ret);
          });
        break;
      case 'reboot':
        writeToSocket(8)
          .then(() => {
            ret.msg = 'reboot';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiErrorCode.INVALID_INPUT_PARA;
            res.json(ret);
          });
        break;
      default:
        ret.msg = 'input invalid atx command';
        ret.code = ApiErrorCode.INVALID_INPUT_PARA;
        res.json(ret);
        break;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Writes a command to the socket.
 *
 * @param {number} cmd - The command to write to the socket.
 * @returns {Promise<void>} - A promise that resolves when the command is successfully written to the socket.
 */
function writeToSocket(cmd) {
  return new Promise((resolve, reject) => {
    const message = Buffer.from([cmd]);
    const client = createSocket('unix_dgram');
    client.on('error', (err) => {
      client.close();
      reject(err);
    });
    const { atx } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    client.send(message, 0, message.length, atx.controlSockPath, (err) => {
      if (err) {
        client.close();
        reject(err);
      } else {
        client.close();
        resolve();
      }
    });
  });
}

export default apiFunc;
