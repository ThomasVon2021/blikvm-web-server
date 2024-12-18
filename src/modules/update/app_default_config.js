import { execSync } from 'child_process';

function getHardwareTypeForConfig() {
    const modelOutput = execSync('cat /proc/device-tree/model').toString();
    const pi4bSys = 'Raspberry Pi 4 Model B';
    const mangoPiSys = 'MangoPi Mcore';
    const piCM4Sys = 'Raspberry Pi Compute Module 4';

    if (modelOutput.includes(pi4bSys) || modelOutput.includes(piCM4Sys)) {
      return 'pi';
    } else if (modelOutput.includes(mangoPiSys)) {
      return 'h616';
    } else {
      return 'none';
    }
}

const hardware = getHardwareTypeForConfig();

const defaultConfig = {
    "version": 5,
    "log": {
      "console": {
        "enabled": true,
        "level": "info"
      },
      "file": {
        "enabled": true,
        "level": "trace",
        "fileName": "/mnt/tmp/logs/app.log",
        "flags": "a",
        "maxLogSize": 30,
        "backups": 3
      }
    },
    "userManager": {
      "userFile": "./config/user.json"
    },
    "switchManager": {
      "file": "./config/switch.json"
    },
    "server": {
      "protocol": "https",
      "https_port": 443,
      "http_port": 80,
      "ssl": {
        "key": "./lib/https/key.pem",
        "cert": "./lib/https/cert.pem"
      },
      "rootPath": "/mnt/blikvm/web_src/web_server",
      "configPath": "/usr/bin/blikvm/package.json",
      "sshUser": "blikvm",
      "sshPassword": "blikvm",
      "auth": true,
      "authExpiration": 12,
      "ipWhite": {
        "enabled": false,
        "list": []
      }
    },
    "video": {
      "port": 10004,
      "shell": "./lib/kvmd-video.sh",
      "bin": `./lib/${hardware}/ustreamer.bin`,
      "fps": 30,
      "quality": 80,
      "kbps": 5000,
      "gop": 30,
      "resolution": "1920x1080",
      "recordPath": "/mnt/tmp/record",
      "recordBin": `./lib/${hardware}/ustreamer-dump`
    },
    "kvmd": {
      "bin": `./lib/${hardware}/kvmd-main`,
      "janusBin": `./lib/${hardware}/janus`
    },
    "display": {
      "isActive": true,
      "mode": 1,
      "onBootTime": 3600,
      "cycleInterval": 60,
      "displayTime": 10,
      "secondIP": ""
    },
    "atx": {
      "controlSockFilePath": "/var/blikvm/atx.sock",
      "stateSockFilePath": "/dev/shm/blikvm/atx",
      "power_on_delay": 500,
      "power_off_delay": 5000
    },
    "msd": {
      "enable": true,
      "isoFilePath": "/mnt/msd/user",
      "shell": "./lib/kvmd-msd.sh",
      "stateFilePath": "/mnt/msd/config/msd.json",
      "tusPort": 10002
    },
    "hid": {
      "hidEnable": "./lib/hid/enable-gadget.sh",
      "hidDisable": "./lib/hid/disable-gadget.sh",
      "enable": true,
      "mouseMode": "dual",
      "mouseJiggler": false,
      "jigglerTimeDiff": 60,
      "pass_through": {
        "enabled": false,
        "blockFlag": false,
        "mouse_sensitivity": 0.3
      },
      "shortcuts": {
        "Ctrl+Alt+Del": [
          "ControlLeft",
          "AltLeft",
          "Delete"
        ],
        "Alt+Tab": [
          "AltLeft",
          "Tab"
        ],
        "Alt+F4": [
          "AltLeft",
          "F4"
        ],
        "Alt+Enter": [
          "AltLeft",
          "Enter"
        ],
        "Ctrl+W": [
          "ControlLeft",
          "KeyW"
        ]
      }
    },
    "prometheus":{
      "enabled": false,
      "username": "admin",
      "password": "admin",
      "interval": 15
    }
};

export default defaultConfig;