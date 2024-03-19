import log4js from 'log4js';
import fs from 'fs';

/**
 * Represents a logger that logs messages to multiple loggers.
 */
class Logger {
  /**
   * The singleton instance of the logger.
   * @type {Logger|null}
   * @private
   */
  static _instance = null;

  /**
   * Array containing all the loggers.
   * @type {Array}
   */
  _loggers = [];

  /**
   * Logger constructor.
   * @constructor
   */
  constructor() {
    if (!Logger._instance) {
      Logger._instance = this;
      this._init();
    }

    return Logger._instance;
  }

  /**
   * Traces a message to all loggers.
   * @param {string} message - The message to be traced.
   */
  trace(message) {
    this._loggers.forEach((logger) => {
      logger.trace(message);
    });
  }

  /**
   * Logs a debug message.
   * @param {string} message - The message to be logged.
   */
  debug(message) {
    this._loggers.forEach((logger) => {
      logger.debug(message);
    });
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to be logged.
   */
  info(message) {
    this._loggers.forEach((logger) => {
      logger.info(message);
    });
  }

  /**
   * Logs a warning message.
   * @param {string} message - The warning message to be logged.
   */
  warn(message) {
    this._loggers.forEach((logger) => {
      logger.warn(message);
    });
  }

  /**
   * Logs an error message.
   * @param {string} message - The error message to be logged.
   */
  error(message) {
    this._loggers.forEach((logger) => {
      logger.error(message);
    });
  }

  /**
   * Logs a fatal error message.
   * @param {string} message - The error message to log.
   */
  fatal(message) {
    this._loggers.forEach((logger) => {
      logger.fatal(message);
    });
  }

  /**
   * Initializes the logger.
   * Reads the log configuration from the 'config/app.json' file and sets up the loggers accordingly.
   */
  _init() {
    const { log } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));

    if (!log.console.isPrint && !log.file.isPrint) {
      return;
    }

    const config = {
      appenders: {
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['console'],
          level: 'trace'
        }
      }
    };

    if (log.console.isPrint) {
      config.categories.console = {
        appenders: ['console'],
        level: log.console.level
      };
    }

    if (log.file.isPrint) {
      config.appenders.file = {
        type: 'file',
        filename: log.file.fileName,
        flags: log.file.flags,
        maxLogSize: log.file.maxLogSize * 1024 * 1024,
        backups: log.file.backups
      };
      config.categories.file = {
        appenders: ['file'],
        level: log.file.level
      };
    }

    log4js.configure(config);

    if (log.console.isPrint) {
      this._loggers.push(log4js.getLogger('console'));
    }
    if (log.file.isPrint) {
      this._loggers.push(log4js.getLogger('file'));
    }
  }
}

export default Logger;
