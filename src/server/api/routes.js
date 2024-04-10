import { apiFuncATXClick, apiFuncATXState } from './atx.route.js';
import deviceId from './device_id.route.js';
import state from './state.route.js';
import Video from './video.route.js';
import KVMDMain from './kvmd_main.route.js';

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
  { path: '/api/video', handler: Video, method: 'post' },
  { path: '/api/kvmdmain', handler: KVMDMain, method: 'post' }
];

export default routes;
