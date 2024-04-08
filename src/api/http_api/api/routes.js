import hello from './hello.route.js';
import atxFunc from './atx.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  { path: '/hello', handler: hello, method: 'post' },
  { path: '/atx', handler: atxFunc, method: 'post' }
];

export default routes;
