"use strict";
// Common types for Lambda handlers
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_RESPONSE = exports.SUCCESS_RESPONSE = void 0;
const SUCCESS_RESPONSE = (data) => ({
    statusCode: 200,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(data),
});
exports.SUCCESS_RESPONSE = SUCCESS_RESPONSE;
const ERROR_RESPONSE = (statusCode, message) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({ error: message }),
});
exports.ERROR_RESPONSE = ERROR_RESPONSE;
