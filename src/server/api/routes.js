import { apiATXClick, apiATXState } from './atx.route.js';
import deviceId from './device_id.route.js';
import state from './state.route.js';
import video from './video.route.js';
import KVMDMain from './kvmd_main.route.js';
import hid from './hid.route.js';
import {
  apiUpload,
  apiCreate,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage
} from './msd.route.js';
import { apiLogin, apiChangeAccount } from './login.route.js';

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
  { path: '/api/device_id', handler: deviceId, method: 'post' },
  { path: '/api/state', handler: state, method: 'post' },
  { path: '/api/video', handler: video, method: 'post' },
  { path: '/api/kvmdmain', handler: KVMDMain, method: 'post' },
  { path: '/api/hid', handler: hid, method: 'post' },
  { path: '/api/msd/upload', handler: apiUpload, method: 'post' },
  { path: '/api/msd/create', handler: apiCreate, method: 'post' },
  { path: '/api/msd/state', handler: apiState, method: 'post' },
  { path: '/api/msd/connect', handler: apiConnect, method: 'post' },
  { path: '/api/msd/images', handler: apiImages, method: 'post' },
  { path: '/api/msd/remove', handler: apiRemoveMSD, method: 'post' },
  { path: '/api/msd/delete', handler: apiDeleteImage, method: 'post' },
  { path: '/api/login', handler: apiLogin, method: 'post' },
  { path: '/api/changeaccount', handler: apiChangeAccount, method: 'post' }
];

export default routes;
