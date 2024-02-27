import greet from './greet.route.js'

const routes = [
    { path: '/greet', handler: greet, method: 'get' }
]

export default routes;