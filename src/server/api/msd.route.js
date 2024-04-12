import { ApiCode, createApiObj } from '../../common/api.js';

/**
 * /api/msd/state
 * /api/msd/upload?image=test.iso
 * /api/msd/upload_remote?url=http://example.com/test.iso
 * /api/msd/make_msd?type=ventoy?image=test.iso?name=ventoy?size=4G
 * /api/msd/set_connected?connected=1
 * /api/msd/remove?image=test.iso
 * /api/msd/delete_msd
 * /api/msd/copy?action=blikvm_to_pc
 * /api/msd/images
**/

function api(req, res, next) {

}

export default api;
