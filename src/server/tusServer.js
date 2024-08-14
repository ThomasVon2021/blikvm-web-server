
/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/

import { Server, EVENTS } from '@tus/server';
import { FileStore } from '@tus/file-store';
import fs from 'fs';
import path from 'path';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import Logger from '../log/logger.js';

const logger = new Logger();

function createTusServer() {
    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const server = new Server({
        path: msd.isoFilePath,
        datastore: new FileStore({ directory: msd.isoFilePath }),
        namingFunction(req, metadata) {
            logger.info("metadata: ", metadata);
            return `${metadata.filename}`;
        },
    });

    server.on(EVENTS.POST_FINISH, (req, res, upload) => {
        const metadataFilePath = path.join(msd.isoFilePath, `${upload.id}.json`);
        fs.unlink(metadataFilePath, (err) => {
            if (err) logger.error(`Failed to delete metadata file: ${err.message}`);
        });
    });

    return server;
}

function startTusServer() {
    const server = createTusServer();
    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const port = msd.tusPort;
    const host = '0.0.0.0';
    server.listen({ host, port }, () => {
        logger.info(`tus server listening at http://0.0.0.0:${port}`);
    });

    return server;
}

export default startTusServer;
