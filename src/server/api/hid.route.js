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
import HID from '../../modules/kvmd/kvmd_hid.js';
import Keyboard from '../keyboard.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import fs from 'fs';

function apiEnableHID(req, res, next) {
  try {
    const returnObject = createApiObj();
    const action = req.query.action;
    const hid = new HID();
    if (action === 'enable') {
      hid
        .startService()
        .then(() => {
          returnObject.msg = 'hid enable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else if (action === 'disable') {
      hid
        .closeService()
        .then(() => {
          returnObject.msg = 'hid disable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else {
      returnObject.msg = `input invalid hid command: ${action}`;
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
    }
  } catch (err) {
    next(err);
  }
}

function apiChangeMode(req, res, next) {
  try {
    const returnObject = createApiObj();
    const absolute = req.query.absolute;
    const hid = new HID();
    hid
      .changeMode(absolute)
      .then(() => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = `hid change mode to absolute:${absolute} successful`;
        res.json(returnObject);
      })
      .catch((err) => {
        returnObject.msg = err.message;
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(returnObject);
      });
  } catch (err) {
    next(err);
  }
}

function apiGetStatus(req, res, next) {
  try {
    const returnObject = createApiObj();
    const hid = new HID();
    returnObject.data = hid.getStatus();
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'hid get status ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiKeyboardPaste(req, res, next) {
  try {
    const returnObject = createApiObj();
    const text = req.body;
    if (typeof text !== 'string') {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'input data is not string';
      res.json(returnObject);
      return;
    }
    const keyboard = new Keyboard();
    keyboard.pasteData(text);
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'paste data ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiKeyboardShortcuts(req, res, next) {
  try {
    const returnObject = createApiObj();
    const keycode = req.body.shortcuts;
    const keyboard = new Keyboard();
    keyboard.shortcuts(keycode);
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'shortcuts ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiGetShortcutsConfig(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'shortcuts ok';
    returnObject.data = hid.shortcuts;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}




export { apiEnableHID, apiChangeMode, apiGetStatus, apiKeyboardPaste, apiKeyboardShortcuts, apiGetShortcutsConfig };
