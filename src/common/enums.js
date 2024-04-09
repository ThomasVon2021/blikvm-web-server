/**
 * Represents the hardware types.
 * @enum {number}
 */
const HardwareType = {
  /**
   * Unknown hardware type.
   */
  UNKNOW: 0,
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
  MangoPi: 3
};

const ModuleState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

export { HardwareType, ModuleState };
