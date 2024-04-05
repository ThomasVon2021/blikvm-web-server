/**
 * This module defines the API object and its default values.
 * @module api/common/api
 */

/**
 * The version of the API.
 * @type {string}
 */
const API_VERSION = '1.0.0';

/**
 * Represents the error codes used in the API.
 * 100-199 indicates request error,
 * 200-299 indicates server error.
 * @enum {number}
 */
const ApiErrorCode = {
  OK: 0,
  INVALID_KEY_OR_OTP: 100,
  INVALID_INPUT_PARA: 101,
  INTERVAEL_SERVER_ERROR: 200
};

/**
 * Creates an API object with default values.
 * @returns {Object} The created API object.
 * @property {string} version The version of the API.
 * @property {string} msg The message of the API.
 * @property {ApiErrorCode} code The error code of the API.
 * @property {Object} data The data of the API.
 */
function createApiObj() {
  return {
    version: API_VERSION,
    msg: '',
    code: ApiErrorCode.OK,
    data: {}
  };
}

export { API_VERSION, ApiErrorCode, createApiObj };
