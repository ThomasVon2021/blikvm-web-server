/**
 * This module defines the mouse event handler.
 * @module api/http_api/mouse
 */

import Logger from '../log/logger.js';
import { isDeviceFile } from '../common/tool.js';
import fs from 'fs';

const logger = new Logger();

class Mouse {
  static _instance = null;
  _onlineStatus = true;

  constructor() {
    if (!Mouse._instance) {
      Mouse._instance = this;
    }
    return Mouse._instance;
  }

  /**
   * Handles the mouse event and writes the data to /dev/hidg1.
   * @param {MouseEvent} event - The mouse event object.
   */
  handleEvent(event) {
    const {
      buttons,
      relativeX,
      relativeY,
      verticalWheelDelta,
      horizontalWheelDelta,
      isAbsoluteMode,
      sensitivity
    } = event;
    let data = null;
    if (isAbsoluteMode === true) {
      data = this._prepareAbsoluteMouseEvent(
        buttons,
        relativeX,
        relativeY,
        verticalWheelDelta,
        horizontalWheelDelta
      );
    } else {
      data = this._prepareRelativeMouseEvent(
        buttons,
        relativeX,
        relativeY,
        verticalWheelDelta,
        horizontalWheelDelta,
        sensitivity
      );
    }

    const fileName = '/dev/hidg1';
    if (isDeviceFile(fileName)) {
      fs.writeFile('/dev/hidg1', data, (error) => {
        if (error) {
          this._onlineStatus = false;
          logger.info(`Error writing to /dev/hidg1: ${error.message}`);
        } else {
          this._onlineStatus = true;
        }
      });
    } else {
      this._onlineStatus = false;
      logger.info('File /dev/hidg1 does not exist');
    }
  }

  getStatus() {
    return this._onlineStatus;
  }

  /**
   * Prepares a relative mouse event buffer based on the provided parameters.
   * @param {number} buttons - The button state of the mouse.
   * @param {number} movementX - The relative X movement of the mouse.
   * @param {number} movementY - The relative Y movement of the mouse.
   * @param {number} verticalWheelDelta - The vertical wheel delta of the mouse.
   * @param {number} horizontalWheelDelta - The horizontal wheel delta of the mouse.
   * @returns {Buffer} - The relative mouse event buffer.
   * @private`
   */
  _prepareRelativeMouseEvent(
    buttons,
    movementX,
    movementY,
    verticalWheelDelta,
    horizontalWheelDelta,
    sensitivity
  ) {
    const x = Math.min(Math.max(-127, Math.floor(movementX * sensitivity)), 127);
    const y = Math.min(Math.max(-127, Math.floor(movementY * sensitivity)), 127);
    logger.info(`relativeX:${x} relativeY:${y}`);
    const buf = [0, 0, 0, 0, 0];
    buf[0] = buttons;
    buf[1] = x & 0xff;
    buf[2] = y & 0xff;
    buf[3] = this._translateVerticalWheelDelta(verticalWheelDelta) & 0xff;
    buf[4] = horizontalWheelDelta & 0xff;
    return Buffer.from(buf);
  }

  /**
   * Prepares a mouse event buffer based on the provided parameters.
   * @param {number} buttons - The button state of the mouse.
   * @param {number} relativeX - The relative X coordinate of the mouse.
   * @param {number} relativeY - The relative Y coordinate of the mouse.
   * @param {number} verticalWheelDelta - The vertical wheel delta of the mouse.
   * @param {number} horizontalWheelDelta - The horizontal wheel delta of the mouse.
   * @returns {Buffer} - The mouse event buffer.
   * @private
   */
  _prepareAbsoluteMouseEvent(
    buttons,
    relativeX,
    relativeY,
    verticalWheelDelta,
    horizontalWheelDelta
  ) {
    const [x, y] = this._scaleMouseCoordinates(relativeX, relativeY);
    // logger.info(`AbsoluteX:${relativeX} AbsoluteY:${relativeY}`);
    const buf = [0, 0, 0, 0, 0, 0, 0];
    buf[0] = buttons;
    buf[1] = x & 0xff;
    buf[2] = (x >> 8) & 0xff;
    buf[3] = y & 0xff;
    buf[4] = (y >> 8) & 0xff;
    buf[5] = this._translateVerticalWheelDelta(verticalWheelDelta) & 0xff;
    buf[6] = horizontalWheelDelta & 0xff;
    return Buffer.from(buf);
  }

  /**
   * Scales the mouse coordinates based on the given relative values.
   * @param {number} relativeX - The relative X coordinate.
   * @param {number} relativeY - The relative Y coordinate.
   * @returns {number[]} The scaled mouse coordinates as an array [x, y].
   * @private
   */
  _scaleMouseCoordinates(relativeX, relativeY) {
    const maxHidValue = 0x7fff;
    const x = parseInt(relativeX * maxHidValue);
    const y = parseInt(relativeY * maxHidValue);

    return [x, y];
  }

  /**
   * Translates the vertical wheel delta value.
   * @param {number} value - The vertical wheel delta value to be translated.
   * @returns {number} The translated vertical wheel delta value.
   * @private
   */
  _translateVerticalWheelDelta(value) {
    return -value;
  }

  setRelativeSens(value) {
    this._relative_sens = value;
  }
}

export default Mouse;
