
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
import { fileExists, getHardwareType } from '../../common/tool.js';
import { StreamerType, HardwareType } from '../../common/enums.js';
import http from 'http';

import { execSync, exec } from 'child_process';

class Video extends ModuleApp {
  static _instance = null;

  _port = 0;

  _streamerType = 0;

  _hardwareType = 0;

  _v4_support_resolution = ['1920x1080', '1600x1200', '1360x768', '1280x1024', '1280x960', '1280x720', '800x600', '720x480', '640x480'];
  constructor(streamerType, hardwareType) {
    if (!Video._instance) {
      super();
      Video._instance = this;

      this._streamerType = streamerType;

      this._hardwareType = hardwareType;

      this._init();
    }

    return Video._instance;
  }

  runVideoStreamer() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._name = 'video';
    this._port = this.getVideoConfig().port;
    if (this._streamerType == StreamerType.Ustreamer) {
      this._bin = video.ustreamer.bin;
      port = video.ustreamer.port;
      quality = video.quality;
      fps = video.fps;
      kbps = video.kbps;
      gop = video.gop;
      resolution = video.resolution;
      if (this._hardwareType === HardwareType.PI4B || this._hardwareType === HardwareType.CM4) {
        if (fileExists('/mnt/exec/release/lib/edid.txt')) {
          execSync('v4l2-ctl --set-edid=file=/mnt/exec/release/lib/edid.txt --fix-edid-checksums');
        } else if (fileExists('./lib/edid.txt')) {
          execSync('v4l2-ctl --set-edid=file=./lib/edid.txt --fix-edid-checksums');
        } else {
          console.log('no edid');
        }
        execSync('v4l2-ctl --set-dv-bt-timings query');
        this._param = [`--device=/dev/video0`, `--host=0.0.0.0`, `--port=${port}`, '--persistent', '--dv-timings', '--format=uyvy', '--encoder=omx', '--workers=3', `--quality=${quality}`, `--desired-fps=${fps}`, `--h264-bitrate=${kbps}`, `--h264-gop=${gop}`, '--drop-same-frames=30', '--last-as-blank=0', '--h264-sink=demo::ustreamer::h264'];
      } else if (this._hardwareType === HardwareType.MangoPi) {
        let jpeg_supported_device = '';
        const devices = execSync('ls /dev/video*').toString().trim().split('\n');

        for (const device of devices) {
          try {
            const output = execSync(`v4l2-ctl --list-formats-ext -d ${device}`).toString();
            if (output.includes('JPEG')) {
              jpeg_supported_device = device;
              break;
            }
          } catch (error) {
            continue;
          }
        }
        if (jpeg_supported_device) {
          console.log(`find support JPEG video device: ${jpeg_supported_device}`);
          this._param = [`--format=MJPEG`, `--device=${jpeg_supported_device}`, `--resolution=${resolution}`, `--host=0.0.0.0`, `--port=${port}`, `--drop-same-frames=30`, `--desired-fps=${fps}`, `--quality=${quality} &`];
        }
      } else {
        console.log('not find JPEG video device, use video1');
        this._param = [`--format=MJPEG`, `--device=/dev/video1`, `--resolution=1920x1080`, `--host=0.0.0.0` `--port=${port}`, `--drop-same-frames=30 &`];
      }

    } else if (this._streamerType == StreamerType.Gstreamer) {
      this._bin = video.gstreamer.bin;
      if (this._hardwareType === HardwareType.OrangePiCM4) {
        if (video.gstreamer.decode === "H264") {
          this._param = [`-e`, `v4l2src ! video/x-raw,width=1920,height=1080,framerate=60/1,format=NV12 ! queue ! mpph264enc qp-init=50 gop=60 bps-max=3000000 ! h264parse ! rtph265pay name=pay_pt ! rtspclientsink latency=100 name=sink  location=rtsp://127.0.0.1:8554/test alsasrc device=hw:1 ! audio/x-raw,rate=48000,channels=2 ! queue ! opusenc bitrate=320000 ! rtpopuspay ! sink.`];
        } else {
          this._param = [`-e`, `v4l2src ! video/x-raw,width=1920,height=1080,framerate=60/1,format=NV12 ! queue ! mpph265enc qp-init=50 gop=60 bps-max=3000000 ! h265parse ! rtph265pay name=pay_pt ! rtspclientsink latency=100 name=sink  location=rtsp://127.0.0.1:8554/test alsasrc device=hw:1 ! audio/x-raw,rate=48000,channels=2 ! queue ! opusenc bitrate=320000 ! rtpopuspay ! sink.`];
        }
      }
    } else {
      this._bin = video.gstreamer.bin;
      if (this._hardwareType === HardwareType.OrangePiCM4) {
        if (video.gstreamer.decode === "H264") {
          this._param = [`-e`, `v4l2src ! video/x-raw,width=1920,height=1080,framerate=60/1,format=NV12 ! queue ! mpph264enc qp-init=50 gop=60 bps-max=3000000 ! h264parse ! rtph265pay name=pay_pt ! rtspclientsink latency=100 name=sink  location=rtsp://127.0.0.1:8554/test alsasrc device=hw:1 ! audio/x-raw,rate=48000,channels=2 ! queue ! opusenc bitrate=320000 ! rtpopuspay ! sink.`];
        } else {
          this._param = [`-e`, `v4l2src ! video/x-raw,width=1920,height=1080,framerate=60/1,format=NV12 ! queue ! mpph265enc qp-init=50 gop=60 bps-max=3000000 ! h265parse ! rtph265pay name=pay_pt ! rtspclientsink latency=100 name=sink  location=rtsp://127.0.0.1:8554/test alsasrc device=hw:1 ! audio/x-raw,rate=48000,channels=2 ! queue ! opusenc bitrate=320000 ! rtpopuspay ! sink.`];
        }
      }
      console.log('Unknown streamer type. No action performed.');
    }
    if (!this._bin) {
      console.error("Error: No binary found for streamer.");
      return;
    }
    
  }

  _init() {
    this.runVideoStreamer();
  }

  setDecodeParam(decode) {
    const configPath = CONFIG_PATH;
    const config = JSON.parse(fs.readFileSync(configPath, UTF8));
    if (this._streamerType == StreamerType.Gstreamer) {
      config.video.gstreamer.decode = decode;
    } 
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);
    runVideoStreamer();
  }

  setResolution(resolution) {
    const configPath = CONFIG_PATH;
    const config = JSON.parse(fs.readFileSync(configPath, UTF8));
    if (this._streamerType == StreamerType.Gstreamer) {
      // config.video.gstreamer.resolution = resolution;
    } else if (this._streamerType == StreamerType.Ustreamer) {
      config.video.ustreamer.resolution = resolution;
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);
    runVideoStreamer();
  }

  getVideoConfig() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const videoConfig = {
      ...(this._streamerType === StreamerType.Ustreamer && {
        port: video.ustreamer.port,
        fps: video.ustreamer.fps,
        quality: video.ustreamer.quality,
        kbps: video.ustreamer.kbps,
        gop: video.ustreamer.gop,
        resolution: video.ustreamer.resolution
      }),

      // Gstreamer通用配置
      ...(this._streamerType === StreamerType.Gstreamer && {
        kbps: video.gstreamer.kbps,
        gop: video.gstreamer.gop
      })
    };
    if (getHardwareType() === HardwareType.MangoPi) {
      videoConfig.support_resolution = this._v4_support_resolution;
    }
    return videoConfig;
  }

  getVideoState() {
    return new Promise((resolve, reject) => {
      getRequest(`http://127.0.0.1:${this._port}/state`)
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
    if (this._streamerType == StreamerType.Gstreamer) {
      config.video.gstreamer.kbps = videoConfig.kbps;
      config.video.gstreamer.gop = videoConfig.gop;
    } else if (this._streamerType == StreamerType.Ustreamer) { 
      config.video.ustreamer.fps = videoConfig.fps;
      config.video.ustreamer.quality = videoConfig.quality;
      config.video.ustreamer.kbps = videoConfig.kbps;
      config.video.ustreamer.gop = videoConfig.gop;
    }

    // this._param = [config.video.param.pi.bin, config.video.param.pi.port, config.video.param.fps, config.video.param.pi.quality, config.video.param.pi.kbps, config.video.param.pi.gop, config.video.param.pi.resolution];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);
    runVideoStreamer();
  }

  getSnapshotUrl() {
    // this._port = getVideoConfig().port;
    return `http://127.0.0.1:${this._port}/snapshot`;
  }

  async getSnapshotImage() {
    const url = `http://127.0.0.1:${this._port}/snapshot`;

    return new Promise((resolve, reject) => {
      http.get(url, (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      }).on('error', (error) => {
        console.error('Error fetching snapshot:', error);
        reject(error);
      });
    });
  }
}
export default Video;
