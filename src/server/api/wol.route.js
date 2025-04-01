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

import { createApiObj, ApiCode } from '../../common/api.js';
import fs from 'fs';
import WakeOnLan from '../../modules/wol.js';


function apiWakeOnLan(req, res, next) {
  try {
    const ret = createApiObj();
    const macAddress = req.query.mac;
    const wol = new WakeOnLan(macAddress);

    wol.sendMagicPacket()
    .then(() => {
        ret.msg = 'Magic packet sent';
        res.json(ret);
    })
    .catch((err) => {
        ret.msg = err.message;
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(ret);
        next(err);
    });
  } catch (err) {
    next(err);
  }
}

function apiWakeOnLanList(req, res, next) {
  try {
    const ret = createApiObj();
    const macAddresses = req.body.macs; // 获取MAC地址数组
    const promises = macAddresses.map(macAddress => {
      const wol = new WakeOnLan(macAddress);
      return wol.sendMagicPacket();
    });

    Promise.all(promises)
      .then(() => {
        ret.msg = 'Magic packets sent';
        res.json(ret);
      })
      .catch((err) => {
        ret.msg = err.message;
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(ret);
        next(err);
      });
  } catch (err) {
    next(err);
  }
}

export { apiWakeOnLan, apiWakeOnLanList };
