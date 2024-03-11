import hello from './hello.route.js';
import error from './error.route.js';

const routes = [
    { path: '/hello', handler: hello, method: 'post' },
    { path: '/error', handler: error, method: 'post' }
];

export default routes;