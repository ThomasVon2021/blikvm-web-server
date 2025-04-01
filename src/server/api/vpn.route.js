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
import { executeCMD } from '../../common/tool.js';  
import Logger from '../../log/logger.js';

const logger = new Logger();

function apiVPNEnable(req, res, next) {
    try{
        const returnObject = createApiObj();
        const { vpn, enable } = req.body;
        if(vpn !== 'tailscaled' && vpn !== 'zerotier-one' && vpn !== 'wg-quick@wg0' )
        {
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            returnObject.msg = `vpn:${vpn} error, only support tailscaled, zerotier-one, wg-quick@wg0`;
            res.json(returnObject);
            return;
        }
        if(enable === true){
            executeCMD(`systemctl enable --now ${vpn}`)
            .then(() => {
                returnObject.msg = `${vpn} start success`;
                res.json(returnObject);
            })
            .catch((err) => {
                returnObject.msg = err.message;
                returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                res.json(returnObject);
                next(err);
            });
        }else{
            executeCMD(`systemctl disable --now ${vpn}`)
            .then(() => {
                returnObject.msg = `${vpn} stop success`;
                res.json(returnObject);
            })
            .catch((err) => {
                returnObject.msg = err.message;
                returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                res.json(returnObject);
                next(err);
            });
        }
    }catch(err){
        next(err);
    }
}

function apiVPNState(req, res, next) {
    try {
        const returnObject = createApiObj();
        const vpns = ['tailscaled', 'zerotier-one', 'wg-quick@wg0'];
        const promises = vpns.map(vpn => executeCMD(`systemctl is-active ${vpn}`)
            .then(stdout => ({ vpn, state: stdout.trim() }))
            .catch(() => ({ vpn, state: 'inactive' }))); // 只返回状态，不包含错误信息

        Promise.all(promises)
            .then(results => {
                returnObject.data = results.reduce((acc, { vpn, state }) => {
                    acc[vpn] = state;
                    return acc;
                }, {});
                res.json(returnObject);
            })
            .catch((err) => {
                if (!res.headersSent) {
                    returnObject.msg = err.message;
                    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                    res.json(returnObject);
                }
                next(err);
            });
    } catch (error) {
        if (!res.headersSent) {
            next(error);
        }
    }
}

export { apiVPNEnable, apiVPNState };
