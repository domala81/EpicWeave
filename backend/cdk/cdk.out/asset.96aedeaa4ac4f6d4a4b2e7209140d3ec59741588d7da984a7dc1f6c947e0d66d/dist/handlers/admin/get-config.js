"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const types_1 = require("../../types");
const ssm = new client_ssm_1.SSMClient({});
const PARAMETER_PREFIX = '/EpicWeave/';
const CATEGORY_PREFIXES = {
    pricing: '/EpicWeave/pricing/',
    session: '/EpicWeave/session/',
    mythology: '/EpicWeave/mythology/',
    ai: '/EpicWeave/ai/',
    shipping: '/EpicWeave/shipping/',
};
/**
 * GET /admin/config?category=
 * Read Parameter Store values, optionally filtered by category
 * Requires: Admin role
 */
const handler = async (event) => {
    try {
        const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
        if (userRole !== 'admin') {
            return (0, types_1.ERROR_RESPONSE)(403, 'Admin access required');
        }
        const { category } = event.queryStringParameters || {};
        let prefix = PARAMETER_PREFIX;
        if (category) {
            if (!CATEGORY_PREFIXES[category]) {
                return (0, types_1.ERROR_RESPONSE)(400, `Invalid category. Must be one of: ${Object.keys(CATEGORY_PREFIXES).join(', ')}`);
            }
            prefix = CATEGORY_PREFIXES[category];
        }
        const params = [];
        let nextToken;
        do {
            const response = await ssm.send(new client_ssm_1.GetParametersByPathCommand({
                Path: prefix,
                Recursive: true,
                NextToken: nextToken,
            }));
            if (response.Parameters) {
                for (const param of response.Parameters) {
                    const name = param.Name;
                    const cat = Object.entries(CATEGORY_PREFIXES).find(([, p]) => name.startsWith(p));
                    params.push({
                        name,
                        value: param.Value,
                        type: param.Type,
                        category: cat ? cat[0] : 'other',
                        lastModified: param.LastModifiedDate?.toISOString(),
                        version: param.Version,
                    });
                }
            }
            nextToken = response.NextToken;
        } while (nextToken);
        // Group by category
        const grouped = {};
        for (const param of params) {
            if (!grouped[param.category]) {
                grouped[param.category] = [];
            }
            grouped[param.category].push(param);
        }
        return (0, types_1.SUCCESS_RESPONSE)({
            parameters: params,
            grouped,
            count: params.length,
            categories: Object.keys(grouped),
            filter: category || 'all',
        });
    }
    catch (error) {
        console.error('Error getting config:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get configuration');
    }
};
exports.handler = handler;
