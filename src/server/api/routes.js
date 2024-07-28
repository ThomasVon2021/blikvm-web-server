import { apiATXClick, apiATXState } from './atx.route.js';
import state from './state.route.js';
import { apiVideoControl, apiVideoConfig, apiGetVideoState } from './video.route.js';
import KVMDMain from './kvmd_main.route.js';
import { apiEnableHID, apiChangeMode, apiGetStatus } from './hid.route.js';
import {
  apiUpload,
  apiCreateMSD,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage,
  apiGetUploadProgress,
  apiGetMakeImageProgress
} from './msd.route.js';
import { apiLogin, apiChangeAccount } from './login.route.js';
import {
  apiEnableSwitch,
  apiGetSwitchState,
  apiChangeChannel,
  apiSetSwitchDevicePath,
  apiSetSwitchLabel,
  apiGetSwitchList,
  apiSetSwitchModule
} from './switch.route.js';
import { apiReboot, apiGetDevice, apiGetSystemInfo } from './system.routes.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  { path: '/api/atx/state', handler: apiATXState, method: 'post' },
  { path: '/api/atx/click', handler: apiATXClick, method: 'post' },
  { path: '/api/state', handler: state, method: 'post' },
  { path: '/api/video', handler: apiVideoControl, method: 'post' },
  { path: '/api/video/config', handler: apiVideoConfig, method: 'post' },
  { path: '/api/video/state', handler: apiGetVideoState, method: 'post' },
  { path: '/api/kvmdmain', handler: KVMDMain, method: 'post' },
  { path: '/api/hid', handler: apiEnableHID, method: 'post' },
  { path: '/api/hid/mode', handler: apiChangeMode, method: 'post' },
  { path: '/api/hid/status', handler: apiGetStatus, method: 'post' },
  { path: '/api/msd/upload', handler: apiUpload, method: 'post' },
  { path: '/api/msd/upload/progress', handler: apiGetUploadProgress, method: 'post' },
  { path: '/api/msd/create', handler: apiCreateMSD, method: 'post' },
  { path: '/api/msd/create/progress', handler: apiGetMakeImageProgress, method: 'post' },
  { path: '/api/msd/state', handler: apiState, method: 'post' },
  { path: '/api/msd/connect', handler: apiConnect, method: 'post' },
  { path: '/api/msd/images', handler: apiImages, method: 'post' },
  { path: '/api/msd/remove', handler: apiRemoveMSD, method: 'post' },
  { path: '/api/msd/delete', handler: apiDeleteImage, method: 'post' },
  { path: '/api/login', handler: apiLogin, method: 'post' },
  { path: '/api/changeaccount', handler: apiChangeAccount, method: 'post' },
  { path: '/api/switch/enable', handler: apiEnableSwitch, method: 'post' },
  { path: '/api/switch/state', handler: apiGetSwitchState, method: 'post' },
  { path: '/api/switch/change', handler: apiChangeChannel, method: 'post' },
  { path: '/api/switch/setpath', handler: apiSetSwitchDevicePath, method: 'post' },
  { path: '/api/switch/setlabel', handler: apiSetSwitchLabel, method: 'post' },
  { path: '/api/switch/getlist', handler: apiGetSwitchList, method: 'post' },
  { path: '/api/switch/setmodule', handler: apiSetSwitchModule, method: 'post' },
  { path: '/api/reboot', handler: apiReboot, method: 'post' },
  { path: '/api/device', handler: apiGetDevice, method: 'post' },
  { path: '/api/systeminfo', handler: apiGetSystemInfo, method: 'post' }
];

export default routes;
