import Logger from "../../log/logger.js";
import fs from 'fs';

const logger=new Logger();

function handleMouse(event) {
    const { buttons, relativeX, relativeY, verticalWheelDelta, horizontalWheelDelta } = event;
    const data = prepareMouseEvent(buttons, relativeX, relativeY, verticalWheelDelta, horizontalWheelDelta);
    fs.writeFile('/dev/hidg1', data, (error) => {
        if (error) {
            logger.info(`Error writing to /dev/hidg1: ${error.message}`);
        }
    });
}

function prepareMouseEvent(buttons, relativeX, relativeY, verticalWheelDelta, horizontalWheelDelta) {
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

function scaleMouseCoordinates(relativeX, relativeY) {
    const maxHidValue = 0x7fff;
    const x = parseInt(relativeX * maxHidValue);
    const y = parseInt(relativeY * maxHidValue);

    return [x, y];
}

function translateVerticalWheelDelta(value) {
    return -value;
}

export default handleMouse;