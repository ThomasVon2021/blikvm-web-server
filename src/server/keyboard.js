/**
 * This module defines the keyboard event handler.
 * @module api/http_api/keyboard
 */

import fs from 'fs';
import Logger from '../log/logger.js';
import { isDeviceFile } from '../common/tool.js';

const logger = new Logger();

class Keyboard {
  static _instance = null;
  _onlineStatus = true;

  constructor() {
    if (!Keyboard._instance) {
      Keyboard._instance = this;
    }
    return Keyboard._instance;
  }

  /**
   * Handles the keyboard event and writes the keyboard data to /dev/hidg0.
   * @param {Event} event - The keyboard event.
   */
  handleEvent(event) {
    const keyboardData = this._packData(event);
    const fileName = '/dev/hidg0';
    if (isDeviceFile(fileName)) {
      fs.writeFile('/dev/hidg0', keyboardData, (error) => {
        if (error) {
          this._onlineStatus = false;
          logger.info(`Error writing to /dev/hidg0: ${error.message}`);
        } else {
          this._onlineStatus = true;
        }
      });
    } else {
      this._onlineStatus = false;
      logger.info('File /dev/hidg0 does not exist');
    }
  }

  getStatus() {
    return this._onlineStatus;
  }

  /**
   * Packs the given data into a binary format.
   * @param {string[]} data - The array of keycodes to be packed.
   * @returns {Uint8Array} - The packed binary data.
   * @private
   */
  _packData(data) {
    const special = [
      'ShiftLeft',
      'ControlLeft',
      'AltLeft',
      'MetaLeft',
      'MetaRight',
      'ShiftRight',
      'ControlRight',
      'AltRight'
    ];
    let d1 = 0;
    const dn = [];

    for (const keycode of data) {
      if (special.includes(keycode)) {
        d1 = this._addSpecialKey(d1, keycode);
      } else {
        this._addNormalKey(dn, keycode);
      }
    }

    if (dn.length < 6) {
      const pad = 6 - dn.length;
      for (let i = 0; i < pad; i++) {
        dn.push(0);
      }
    }

    const binData = new Uint8Array([d1, 0, dn[0], dn[1], dn[2], dn[3], dn[4], dn[5]]);
    return binData;
  }

  /**
   * Adds a special key to the current key value.
   * @param {number} current - The current key value.
   * @param {string} add - The special key to add.
   * @returns {number} - The updated key value.
   * @private
   */
  _addSpecialKey(current, add) {
    const shift = 0x02;
    const ctrl = 0x01;
    const alt = 0x04;
    const cmd = 0x08;
    const rctrl = 0x10;
    const rshift = 0x20;
    const ralt = 0x40;
    const rcmd = 0x80;

    if (add === 'ShiftLeft') {
      current |= shift;
    }
    if (add === 'ControlLeft') {
      current |= ctrl;
    }
    if (add === 'AltLeft') {
      current |= alt;
    }
    if (add === 'MetaLeft') {
      current |= cmd;
    }
    if (add === 'ShiftRight') {
      current |= rshift;
    }
    if (add === 'ControlRight') {
      current |= rctrl;
    }
    if (add === 'AltRight') {
      current |= ralt;
    }
    if (add === 'MetaRight') {
      current |= rcmd;
    }

    return current;
  }

  /**
   * Adds a normal key to the current array.
   * @param {Array} current - The current array of keys.
   * @param {string} add - The key to be added.
   * @private
   */
  _addNormalKey(current, add) {
    if (current.length > 6) {
      return;
    }
    const keycode = this._keyCodeMapping(add);
    current.push(keycode);
  }

  /**
   * Maps a keyboard code to a corresponding value.
   * @param {string} bCode - The keyboard code to be mapped.
   * @returns {number|string} - The mapped value for the keyboard code.
   * @private
   */
  _keyCodeMapping(bCode) {
    const mapping = {
      KeyA: 4,
      KeyB: 5,
      KeyC: 6,
      KeyD: 7,
      KeyE: 8,
      KeyF: 9,
      KeyG: 10,
      KeyH: 11,
      KeyI: 12,
      KeyJ: 13,
      KeyK: 14,
      KeyL: 15,
      KeyM: 16,
      KeyN: 17,
      KeyO: 18,
      KeyP: 19,
      KeyQ: 20,
      KeyR: 21,
      KeyS: 22,
      KeyT: 23,
      KeyU: 24,
      KeyV: 25,
      KeyW: 26,
      KeyX: 27,
      KeyY: 28,
      KeyZ: 29,
      Digit1: 30,
      Digit2: 31,
      Digit3: 32,
      Digit4: 33,
      Digit5: 34,
      Digit6: 35,
      Digit7: 36,
      Digit8: 37,
      Digit9: 38,
      Digit0: 39,
      Enter: 40,
      Escape: 41,
      Backspace: 42,
      Tab: 43,
      Space: 44,
      Minus: 45,
      Equal: 46,
      BracketLeft: 47,
      BracketRight: 48,
      Backslash: 49,
      Semicolon: 51,
      Quote: 52,
      Backquote: 53,
      Comma: 54,
      Period: 55,
      Slash: 56,
      CapsLock: 57,
      F1: 58,
      F2: 59,
      F3: 60,
      F4: 61,
      F5: 62,
      F6: 63,
      F7: 64,
      F8: 65,
      F9: 66,
      F10: 67,
      F11: 68,
      F12: 69,
      PrtSc: 70,
      ScrollLock: 71,
      Pause: 72,
      Insert: 73,
      Home: 74,
      PgUp: 75,
      Delete: 76,
      End: 77,
      PgDn: 78,
      ArrowRight: 79,
      ArrowLeft: 80,
      ArrowDown: 81,
      ArrowUp: 82,
      NumLock: 83,
      NumpadDivide: 84,
      NumpadMultiply: 85,
      NumpadSubtract: 86,
      NumpadAdd: 87,
      NumpadEnter: 88,
      Numpad1: 89,
      Numpad2: 90,
      Numpad3: 91,
      Numpad4: 92,
      Numpad5: 93,
      Numpad6: 94,
      Numpad7: 95,
      Numpad8: 96,
      Numpad9: 97,
      Numpad0: 98,
      NumpadDecimal: 99
    };

    if (Object.prototype.hasOwnProperty.call(mapping, bCode)) {
      return mapping[bCode];
    }

    return bCode;
  }
}

export default Keyboard;
