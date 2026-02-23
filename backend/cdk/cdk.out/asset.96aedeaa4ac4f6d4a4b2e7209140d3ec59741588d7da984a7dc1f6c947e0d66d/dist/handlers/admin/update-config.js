"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const ssm = new client_ssm_1.SSMClient({});
const ALLOWED_PARAMETERS = [
    '/EpicWeave/pricing/session-fee',
    '/EpicWeave/pricing/custom-tshirt-base',
    '/EpicWeave/pricing/both-placement-surcharge',
    '/EpicWeave/session/max-iterations',
    '/EpicWeave/mythology/allowed-types',
    '/EpicWeave/ai/image-resolution',
    '/EpicWeave/shipping/flat-rate-base',
];
const PRICING_PARAMETERS = [
    '/EpicWeave/pricing/session-fee',
    '/EpicWeave/pricing/custom-tshirt-base',
    '/EpicWeave/pricing/both-placement-surcharge',
    '/EpicWeave/shipping/flat-rate-base',
];
const NUMERIC_PARAMETERS = [
    ...PRICING_PARAMETERS,
    '/EpicWeave/session/max-iterations',
];
/**
 * PUT /admin/config
 * Update a Parameter Store value with validation
 * Requires: Admin role
 */
const handler = async (event) => {
    try {
        const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (userRole !== 'admin') {
            return (0, types_1.ERROR_RESPONSE)(403, 'Admin access required');
        }
        const body = JSON.parse(event.body || '{}');
        const { parameter, value } = body;
        if (!parameter || value === undefined || value === null) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Parameter name and value are required');
        }
        // Validate parameter is in allowed list
        if (!ALLOWED_PARAMETERS.includes(parameter)) {
            return (0, types_1.ERROR_RESPONSE)(400, `Parameter not allowed. Must be one of: ${ALLOWED_PARAMETERS.join(', ')}`);
        }
        // Validate numeric parameters
        if (NUMERIC_PARAMETERS.includes(parameter)) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Value must be a valid number for pricing parameters');
            }
            if (PRICING_PARAMETERS.includes(parameter) && num < 0) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Pricing values must be positive');
            }
            if (parameter === '/EpicWeave/session/max-iterations' && (num < 1 || num > 20 || !Number.isInteger(num))) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Max iterations must be an integer between 1 and 20');
            }
        }
        // Validate image resolution format
        if (parameter === '/EpicWeave/ai/image-resolution') {
            if (!/^\d+x\d+$/.test(value)) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Image resolution must be in format WIDTHxHEIGHT (e.g., 1024x1024)');
            }
        }
        // Validate mythology types format
        if (parameter === '/EpicWeave/mythology/allowed-types') {
            const types = value.split(',').map((t) => t.trim().toLowerCase());
            if (types.length === 0 || types.some((t) => t.length === 0)) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Mythology types must be a comma-separated list');
            }
        }
        // Get previous value for audit log
        let previousValue;
        try {
            const prev = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: parameter }));
            previousValue = prev.Parameter?.Value;
        }
        catch { /* parameter may not exist yet */ }
        // Update Parameter Store
        await ssm.send(new client_ssm_1.PutParameterCommand({
            Name: parameter,
            Value: String(value),
            Type: 'String',
            Overwrite: true,
        }));
        // Record audit log in DynamoDB
        const now = new Date().toISOString();
        await (0, dynamodb_1.putItem)({
            PK: 'AUDIT#CONFIG',
            SK: `${now}#${parameter}`,
            type: 'config_change',
            parameter,
            previousValue: previousValue || null,
            newValue: String(value),
            changedBy: userId,
            changedAt: now,
        });
        return (0, types_1.SUCCESS_RESPONSE)({
            parameter,
            previousValue: previousValue || null,
            newValue: String(value),
            updatedAt: now,
            message: 'Configuration updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating config:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to update configuration');
    }
};
exports.handler = handler;
