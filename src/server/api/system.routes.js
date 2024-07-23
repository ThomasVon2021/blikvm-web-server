import {
    executeCMD
} from '../../common/tool.js';

function apiReboot(req, res, next) {
    try {
        executeCMD('reboot');
    } catch (error) {
        next(err);
    }
}

export { apiReboot };