
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
import { ApiCode, createApiObj } from '../../common/api.js';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { CONFIG_PATH, JWT_SECRET } from '../../common/constants.js';
import Logger from '../../log/logger.js';
import jwt from 'jsonwebtoken';

const logger = new Logger();

function getUsers() {
  const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const users = fs.readFileSync(userManager.userFile, 'utf8');
  return JSON.parse(users);
}

function apiLogin(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { username, password } = req.body;

    if (!username || !password) {
      returnObject.msg = 'Account name and password cannot be empty!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      return res.json(returnObject);
    }

    const users = getUsers();
    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
      returnObject.msg = 'The username or password is incorrect!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      return res.json(returnObject);
    }
    const expiresTime = 12; // h
    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: `${expiresTime}h`
    });
    returnObject.msg = 'Login sucessful';
    returnObject.code = ApiCode.OK;
    returnObject.data = {
      token,
      username
    };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}
async function changeAccount(oriUsername, newUsername, newPassword) {
  try {
    // Read the configuration file to get the firmware object path
    const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const firmwareFilePath = configData.userManager.userFile;

    // Read the firmware file content
    const firmwareContent = await fsPromises.readFile(firmwareFilePath, 'utf8');
    const usersArray = JSON.parse(firmwareContent);

    // Find the user object by oriUsername
    const user = usersArray.find((user) => user.username === oriUsername);

    if (!user) {
      logger.error('Error: User not found');
      return false;
    }

    // Update the username and password
    user.username = newUsername;
    user.password = newPassword;

    // Convert the updated array back to JSON format
    const updatedJsonContent = JSON.stringify(usersArray, null, 2);

    // Write the updated content back to the JSON file
    await fsPromises.writeFile(firmwareFilePath, updatedJsonContent, 'utf8');

    return true;
  } catch (error) {
    logger.error(`Error during account update: ${error}`);
    return false;
  }
}

async function apiChangeAccount(req, res, next) {
  try {
    const { newUsername, newPassword } = req.body;
    const oriUsername = req.headers.username;
    const response = await changeAccount(oriUsername, newUsername, newPassword);
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
