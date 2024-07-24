import { ApiCode, createApiObj } from '../../common/api.js';
import MSD from '../../modules/kvmd/kvmd_msd.js';

/**
 * /api/msd/state
 * /api/msd/upload?image=test.iso
 * /api/msd/upload?image=http://example.com/test.iso
 * /api/msd/create
 * {"type":"ventoy","images":["test.iso"],"name":"ventoy","size":"4G"}
 * /api/msd/connect?action=true
 * /api/msd/remove
 * /api/msd/delete?image=test.iso
 * /api/msd/images
 * /api/msd/copy?direction=blikvm-to-target
 * /api/msd/copy?direction=target-to-blikvm
 **/

function apiUpload(req, res, next) {
  try {
    const msd = new MSD();
    msd.uploadMultipleAsync(req, res, next);
  } catch (err) {
    next(err);
  }
}

function apiCreate(req, res, next) {
  try {
    const msd = new MSD();
    msd.createMSD(req, res, next);
  } catch (err) {
    next(err);
  }
}

function apiState(req, res, next) {
  try {
    const msd = new MSD();
    const state = msd.getMSDState();
    const returnObject = createApiObj();
    returnObject.data = state;
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiConnect(req, res, next) {
  try {
    const msd = new MSD();
    msd.connectMSD(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function apiImages(req, res, next) {
  try {
    const returnObject = createApiObj();
    const msd = new MSD();
    returnObject.data = await msd.getImages();
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiRemoveMSD(req, res, next) {
  const msd = new MSD();
  msd.removeMSD(req, res, next);
}

function apiDeleteImage(req, res, next) {
  const msd = new MSD();
  const isodir = req.query.image;
  const returnObject = createApiObj();

  msd
    .deleteImage(isodir)
    .then((result) => {
      returnObject.msg = `Delete ${isodir} success`;
      returnObject.code = ApiCode.OK;
      res.json(returnObject);
    })
    .catch((error) => {
      returnObject.msg = `Delete ${isodir} failed: ${error.message}`;
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      res.json(returnObject);
    });
}

function apiGetUploadProgress(req, res, next) {
  const msd = new MSD();
  msd.getUploadProgress(req, res, next);
}

function apiGetMakeImageProgress(req, res, next) {
  const msd = new MSD();
  msd.getMakeImageProgress(req, res, next);
}

export {
  apiUpload,
  apiCreate,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage,
  apiGetUploadProgress,
  apiGetMakeImageProgress
};
