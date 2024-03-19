import hello from './hello.route.js';
import error from './error.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 */
const routes = [
  { path: '/hello', handler: hello, method: 'post' },
  { path: '/error', handler: error, method: 'post' }
];

export default routes;
