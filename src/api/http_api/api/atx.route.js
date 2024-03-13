import { createSocket } from 'unix-dgram';

/**
 * Handles ATX API request.
 *
 * @param {Object} req - The request object, cmd(128):power on/off, cmd(192):force power on/off, cmd(8):reboot.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the API request is handled.
 * @throws {Error} - If there is an error while handling the API request.
 */
async function apiFunc(req, res, next) {
  try {
    const cmd = req.body.cmd;
    switch (cmd) {
      case 128:
        await writeToSocket(cmd);
        res.json({ msg: 'power on/off' });
        break;
      case 192:
        await writeToSocket(cmd);
        res.json({ msg: 'force power on/off' });
        break;
      case 8:
        await writeToSocket(cmd);
        res.json({ msg: 'reboot' });
        break;
      default:
        res.json({ msg: 'input invalid atx command' });
        break;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    client.send(message, 0, message.length, '/var/blikvm/atx.sock', (err) => {
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
