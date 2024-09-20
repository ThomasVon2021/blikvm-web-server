
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
import fs from 'fs';
import ModuleApp from '../module_app.js';
import { getRequest } from "../../common/http.js"
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

class Video extends ModuleApp {
  static _instance = null;

  constructor() {
    if (!Video._instance) {
      super();
      Video._instance = this;
      this._init();
    }

    return Video._instance;
  }

  _init() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._bin = video.shell;
    this._param = [video.bin, video.port, video.fps, video.quality, video.kbps, video.gop];
    this._name = 'video';
  }

  getVideoConfig() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const videoConfig = {
      port: video.port,
      fps: video.fps,
      quality: video.quality,
      kbps: video.kbps,
      gop: video.gop
    };
    return videoConfig;
  }

  getVideoState() {
    return new Promise((resolve, reject) => {
      getRequest(`http://127.0.0.1:${this._param[1]}/state`)
        .then(response => {
          try {
            const jsonData = JSON.parse(response);
            resolve(jsonData);
          } catch (error) {
            reject(`error: ${error.message}`);
          }
        })
        .catch(error => {
          reject(`error: ${error}`); 
        });
    });
  }
  
  setVideoConfig(videoConfig) {
    const configPath = CONFIG_PATH;
    const config = JSON.parse(fs.readFileSync(configPath, UTF8));
    config.video.fps = videoConfig.fps;
    config.video.quality = videoConfig.quality;
    config.video.kbps = videoConfig.kbps;
    config.video.gop = videoConfig.gop;
    this._param = [config.video.bin, config.video.port, config.video.fps, config.video.quality, config.video.kbps, config.video.gop];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);

  }

  getSnapshotUrl(){
    return `http://127.0.0.1:${this._param[1]}/snapshot`;
  }
  
}

export default Video;
