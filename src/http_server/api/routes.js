import deviceId from './device_id.route.js';
import startService from './start_service.route.js';
import closeService from './close_service.route.js';

const routes = [
    { path: '/device_id', handler: deviceId, method: 'post' },
    { path: '/start_service', handler: startService, method: 'post' },
    { path: '/close_service', handler: closeService, method: 'post' }
]

export default routes;