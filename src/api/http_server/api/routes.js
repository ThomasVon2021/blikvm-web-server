import deviceId from './device_id.route.js';
import startService from './start_service.route.js';
import closeService from './close_service.route.js';
import state from './state.route.js';
import startHttpApi from './start_http_api.route.js';
import closeHttpApi from './close_http_api.route.js';
import startVideoApi from './start_video_api.route.js';
import closeVideoApi from './close_video_api.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The path of the route.
 * @property {Function} handler - The handler function for the route.
 * @property {string} method - The HTTP method for the route.
 * @private
 * */
const routes = [
  {
    path: '/device_id',
    handler: deviceId,
    method: 'post'
  },
  {
    path: '/start_service',
    handler: startService,
    method: 'post'
  },
  {
    path: '/close_service',
    handler: closeService,
    method: 'post'
  },
  {
    path: '/state',
    handler: state,
    method: 'post'
  },
  {
    path: '/start_http_api',
    handler: startHttpApi,
    method: 'post'
  },
  {
    path: '/close_http_api',
    handler: closeHttpApi,
    method: 'post'
  },
  {
    path: '/start_video_api',
    handler: startVideoApi,
    method: 'post'
  },
  {
    path: '/close_video_api',
    handler: closeVideoApi,
    method: 'post'
  }
];

export default routes;
