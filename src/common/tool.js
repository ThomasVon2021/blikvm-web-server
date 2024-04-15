/**
 * This module provides utility functions.
 * @module common/tool
 */

import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { HardwareType } from './enums.js';
import { execSync, exec } from 'child_process';

let hardwareSysType = HardwareType.UNKNOWN;

/**
 * Checks if a directory exists at the specified path.
 *
 * @param {string} path - The path to the directory.
 * @returns {boolean} - Returns true if the directory exists, false otherwise.
 */
function dirExists(path) {
  return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

/**
 * Checks if a file exists at the specified path.
 *
 * @param {string} path - The path to the file.
 * @returns {boolean} - Returns true if the file exists and is a regular file, otherwise returns false.
 */
function fileExists(path) {
  return fs.existsSync(path) && fs.lstatSync(path).isFile();
}

function isDeviceFile(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Creates a directory recursively if it doesn't exist.
 * @param {string} dirname - The directory path to create.
 * @returns {boolean} Returns true if the directory is created successfully, false otherwise.
 */
function createDir(dirname) {
  if (dirExists(dirname)) {
    return true;
  }

  const parentDir = path.dirname(dirname);
  if (parentDir !== dirname) {
    if (createDir(parentDir)) {
      fs.mkdirSync(dirname);
      return true;
    }
  }

  return false;
}

/**
 * Creates a file at the specified file path.
 * @param {string} filePath - The path of the file to be created.
 * @param {boolean} [append=false] - Optional. Specifies whether to append to an existing file. Default is false.
 */
function createFile(filePath, append = false) {
  const dirname = path.dirname(filePath);
  createDir(dirname);
  if (append) {
    fs.appendFileSync(filePath, '');
  } else {
    fs.writeFileSync(filePath, '');
  }
}

/**
 * Generates a unique code.
 * @returns {string} The generated unique code.
 */
function generateUniqueCode() {
  return v4();
}

/**
 * Generates a random secret password of the specified length.
 *
 * @param {number} length - The length of the password to generate.
 * @returns {string} The generated password.
 */
function generateSecret(length) {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const allChars = uppercaseChars + lowercaseChars + numberChars;

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

/**
 * Retrieves the hardware type based on the device model.
 * @returns {enmus} The hardware type, see HardwareType.
 */
function getHardwareType() {
  if (hardwareSysType === HardwareType.UNKNOWN) {
    const modelOutput = execSync('cat /proc/device-tree/model').toString();
    const pi4bSys = 'Raspberry Pi 4 Model B';
    const mangoPiSys = 'MangoPi Mcore';
    const piCM4Sys = 'Raspberry Pi Compute Module 4';

    if (modelOutput.includes(pi4bSys)) {
      hardwareSysType = HardwareType.PI4B;
    } else if (modelOutput.includes(mangoPiSys)) {
      hardwareSysType = HardwareType.MangoPi;
    } else if (modelOutput.includes(piCM4Sys)) {
      hardwareSysType = HardwareType.CM4;
    }
  }
  return hardwareSysType;
}

function executeScriptAtPath(scriptPath) {
  const bashCommand = `bash ${scriptPath}`;
  return new Promise((resolve, reject) => {
    exec(bashCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function executeCMD(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function getSystemType() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('ro,noatime')) {
      return 'ro';
    } else if (output.includes('rw,noatime')) {
      return 'rw';
    } else {
      return 'error';
    }
  } catch (error) {
    return 'error';
  }
}

function changetoRWSystem() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('ro,noatime')) {
      execSync('mount -o remount,rw /');
    }
    return true;
  } catch (error) {
    return false;
  }
}

function changetoROSystem() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('rw,noatime')) {
      execSync('mount -o remount,ro /');
    }
    return true;
  } catch (error) {
    return false;
  }
}

function getAllFilesInDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    let fileList = [];

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        fileList.push(filePath);
      } else if (stats.isDirectory()) {
        const subFiles = getAllFilesInDirectory(filePath);
        fileList = fileList.concat(subFiles);
      }
    });
    return fileList;
  } catch (err) {
    return [];
  }
}

export {
  dirExists,
  fileExists,
  createDir,
  createFile,
  generateUniqueCode,
  generateSecret,
  getHardwareType,
  executeScriptAtPath,
  isDeviceFile,
  executeCMD,
  getSystemType,
  changetoRWSystem,
  changetoROSystem,
  getAllFilesInDirectory
};
