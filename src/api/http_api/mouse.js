/**
 * This module defines the mouse event handler.
 * @module api/http_api/mouse
 */

import Logger from '../../log/logger.js';
import fs from 'fs';
import { existFile } from '../../common/tool.js';

const logger = new Logger();

/**
 * Handles the mouse event and writes the data to /dev/hidg1.
 * @param {MouseEvent} event - The mouse event object.
 */
function handleMouse(event) {
  const { buttons, relativeX, relativeY, verticalWheelDelta, horizontalWheelDelta } = event;
  const data = prepareMouseEvent(
    buttons,
    relativeX,
    relativeY,
    verticalWheelDelta,
    horizontalWheelDelta
  );
  const fileName = '/dev/hidg1';
  if (existFile(fileName)) {
    fs.writeFile('/dev/hidg1', data, (error) => {
      if (error) {
        logger.info(`Error writing to /dev/hidg1: ${error.message}`);
      }
    });
  } else {
    logger.info('File /dev/hidg1 does not exist');
  }
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
function prepareMouseEvent(
  buttons,
  relativeX,
  relativeY,
  verticalWheelDelta,
  horizontalWheelDelta
) {
  const [x, y] = scaleMouseCoordinates(relativeX, relativeY);
  const buf = [0, 0, 0, 0, 0, 0, 0];
  buf[0] = buttons;
  buf[1] = x & 0xff;
  buf[2] = (x >> 8) & 0xff;
  buf[3] = y & 0xff;
  buf[4] = (y >> 8) & 0xff;
  buf[5] = translateVerticalWheelDelta(verticalWheelDelta) & 0xff;
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
function scaleMouseCoordinates(relativeX, relativeY) {
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
function translateVerticalWheelDelta(value) {
  return -value;
}

export default handleMouse;
