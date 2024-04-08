import atxFunc from './atx.route.js';
import deviceId from './device_id.route.js';
import state from './state.route.js';
import startVideo from './start_video.route.js';
import closeVideo from './close_video.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  { path: '/atx', handler: atxFunc, method: 'post' },
  { path: '/device_id', handler: deviceId, method: 'post' },
  { path: '/state', handler: state, method: 'post' },
  { path: '/start_video', handler: startVideo, method: 'post' },
  { path: '/close_video', handler: closeVideo, method: 'post' }
];

export default routes;
