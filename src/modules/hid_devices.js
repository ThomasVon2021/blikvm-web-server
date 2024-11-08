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

import Logger from '../log/logger.js';
import { isDeviceFile } from '../common/tool.js';
import fs from 'fs';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import { constants } from 'fs';

const logger = new Logger();

class HIDDevice {
    static _instance = null;
    _onlineStatus = true;
    _lastUserInteraction;
    _devicePath = '';
    eventQueue = [];
    isProcessing = false;
    isClosing = false;
    _fd = null;

    open() {
        return new Promise((resolve, reject) => {
            if (this._fd !== null) {
                logger.warn(`File ${this._devicePath} already opened fd ${this._fd}`);
                resolve(this._fd);
                return;
            }
            logger.info(`Opening file ${this._devicePath}`);
            fs.open(this._devicePath, constants.O_WRONLY | constants.O_NONBLOCK, (err, fd) => {
                if (err) {
                    logger.error(`Error opening file: ${err}`);
                    this._onlineStatus = false;
                    reject(err);  // Reject promise if file opening fails
                    return;
                }
                this._fd = fd;
                logger.warn(`File ${this._devicePath} opened fd ${this._fd}`);
                resolve(fd);  // Resolve promise with the file descriptor if file opens successfully
            });
        });
    }

    close() {
        this.isClosing = true;
        const checkAndClose = () => {
            if (this.isProcessing) {
                setTimeout(checkAndClose, 10);
            } else {
                if (this._fd) {
                    try {
                        fs.closeSync(this._fd);
                        logger.warn(`File ${this._devicePath} closed`);
                        this._fd = null;
                        this.isClosing = false;
                    } catch (err) {
                        logger.error(`Error closing file: ${err}`);
                    }
                }
            }
        };
        checkAndClose();
    }

    updateUserInteraction() {
        this._lastUserInteraction = Date.now();
    }

    handleEvent(event) {
        throw new Error('must overwrite by children class');
    }

    /**
   * Processes the queued events, one every 50ms.
   */
    processQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        } else if (this.isClosing) {
            this.eventQueue = [];
            return;
        }

        this.isProcessing = true;

        const data = this.eventQueue.shift();
        this._writeData(data);

        this.isProcessing = false;
    }

    _writeData(data) {
        if (this.isClosing) {
            return;
        }

        if (this._fd !== null) {
            const dataBuffer = Buffer.from(data);
            //logger.info(`Writing to ${this._devicePath}`);
            fs.write(this._fd, dataBuffer, (err, written) => {
                if (err) {
                    this._onlineStatus = false;
                    logger.warn(`Error writing to ${this._devicePath}: ${err}`);
                } else {
                    this._onlineStatus = true;
                }
            });
        }
    }

    getStatus() {
        return this._onlineStatus;
    }
}

export default HIDDevice;
