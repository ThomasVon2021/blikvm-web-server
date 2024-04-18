import { ApiCode, createApiObj } from '../../common/api.js';
import fs from 'fs';
import fsPromises from 'fs/promises';

import Logger from '../../log/logger.js';

const logger = new Logger();

function apiLogin(req, res, next) {
  const returnObject = createApiObj();
  returnObject.msg = 'Login sucessful';
  returnObject.code = ApiCode.OK;
  res.json(returnObject);
}

async function changeAccount(newUsername, newPassword) {
  try {
    const { firmwareObject } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    const response = await fsPromises.readFile(firmwareObject.firmwareFile, 'utf8');
    const obj = JSON.parse(response);

    // Ensure 'username' and 'password' properties exist in JSON section
    if (!obj.user || !obj.pwd) {
      logger.error('Error: Missing or incorrect username/password in the JSON file');
      return false;
    }
    obj.user = newUsername;
    // Update the password in the JSON object
    obj.pwd = newPassword;

    // Convert the updated object back to JSON format
    const updatedJsonContent = JSON.stringify(obj);

    // Write the updated content back to the JSON file
    await fsPromises.writeFile(firmwareObject.firmwareFile, updatedJsonContent, 'utf8');

    return true;
  } catch (error) {
    logger.error(`Error during password update: ${error}`);
    return false;
  }
}

async function apiChangeAccount(req, res, next) {
  try {
    const { newUsername, newPassword } = req.body;
    const response = await changeAccount(newUsername, newPassword);
    if (response) {
      res.json({
        code: ApiCode.OK,
        msg: 'Account updated successfully'
      });
    } else {
      res.json({
        code: ApiCode.ERROR,
        msg: 'Error updating account'
      });
    }
  } catch (err) {
    next(err);
  }
}

export { apiLogin, apiChangeAccount };
