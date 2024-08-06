import { createWorker  } from 'tesseract.js';
import Video from '../../modules/video/video.js';
import { createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

async function apiOcr(req, res, next) {
  const returnObject = createApiObj();
  try {
    const { lang, rect } = req.body;
    const worker = await createWorker(lang, 1, {
        langPath: './lib/tesseract'
    });
    const video = new Video();
    const rectangle = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const ret = await worker.recognize(video.getSnapshotUrl(), {rectangle});
    await worker.terminate();
    returnObject.msg = 'use tesseract recognize ok';
    returnObject.data = ret.data.text;
    logger.info(ret.data.text);
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
}

export { apiOcr };