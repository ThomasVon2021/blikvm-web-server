
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
/**
 * Represents the hardware types.
 * @enum {number}
 */
const HardwareType = {
  /**
   * Unknown hardware type.
   */
  UNKNOWN: 0,
  /**
   * Raspberry Pi 4B.
   */
  PI4B: 1,
  /**
   * Compute Module 4.
   */
  CM4: 2,
  /**
   * MangoPi hardware.
   */
  MangoPi: 3,
  /**
   * Oriangepi hardware.
   */
  OrangePiCM4: 4
};

/**
 * Represents the streamer types.
 * @enum {number}
 */
const StreamerType = {
    /**
   * Unknown streamer type.
   */
    UNKNOWN: 0,
  /**
   * Unknown streamer type.
   */
  Ustreamer: 1,
  /**
   * Raspberry Pi 4B.
   */
  Gstreamer: 2,

};

const ModuleState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

export { HardwareType, StreamerType, ModuleState };
