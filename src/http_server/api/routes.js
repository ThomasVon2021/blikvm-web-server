import deviceId from './device_id.route.js';
import startService from './start_service.route.js';
import closeService from './close_service.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The path of the route.
 * @property {Function} handler - The handler function for the route.
 * @property {string} method - The HTTP method for the route.
 * */
const routes = [
    { path: '/device_id', handler: deviceId, method: 'post' },
    { path: '/start_service', handler: startService, method: 'post' },
    { path: '/close_service', handler: closeService, method: 'post' }
]

export default routes;