import { apiFuncATXClick, apiFuncATXState } from './atx.route.js';
import deviceId from './device_id.route.js';
import state from './state.route.js';
import startVideo from './start_video.route.js';
import closeVideo from './close_video.route.js';
import startKVMDMain from './start_kvmd_main.route.js';
import closeKVMDMain from './close_kvmd_main.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  { path: '/api/atx/state', handler: apiFuncATXState, method: 'get' },
  { path: '/api/atx/click', handler: apiFuncATXClick, method: 'post' },
  { path: '/api/device_id', handler: deviceId, method: 'post' },
  { path: '/api/state', handler: state, method: 'post' },
  { path: '/api/start_video', handler: startVideo, method: 'post' },
  { path: '/api/close_video', handler: closeVideo, method: 'post' },
  { path: '/api/start_kvmdmain', handler: startKVMDMain, method: 'post' },
  { path: '/api/close_kvmdmain', handler: closeKVMDMain, method: 'post' }
];

export default routes;
