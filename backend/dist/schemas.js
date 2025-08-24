"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthResponseSchema = exports.propertyScoreResponseSchema = exports.marketStatsSchema = exports.certificatesResponseSchema = exports.searchLeadsResponseSchema = exports.certificateSchema = exports.leadSchema = exports.certificateSearchSchema = exports.exportLeadsParamsSchema = exports.leadScoreParamsSchema = exports.searchLeadsParamsSchema = void 0;
const zod_1 = require("zod");
const searchLeadsParamsSchema = zod_1.z.object({
    postcode: zod_1.z.string().optional(),
    rating: zod_1.z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    fuel: zod_1.z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
    page: zod_1.z.number().min(1).default(1),
    pageSize: zod_1.z.number().min(1).max(100).default(50),
});
exports.searchLeadsParamsSchema = searchLeadsParamsSchema;
const leadScoreParamsSchema = zod_1.z.object({
    lmk_key: zod_1.z.string().min(1, 'Property key is required'),
});
exports.leadScoreParamsSchema = leadScoreParamsSchema;
const exportLeadsParamsSchema = zod_1.z.object({
    postcode: zod_1.z.string().optional(),
    rating: zod_1.z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    fuel: zod_1.z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
    limit: zod_1.z.number().min(1).max(10000).default(100),
});
exports.exportLeadsParamsSchema = exportLeadsParamsSchema;
const certificateSearchSchema = zod_1.z.object({
    postcode: zod_1.z.string().min(1, 'Postcode is required'),
    page: zod_1.z.number().min(1).default(1),
    pageSize: zod_1.z.number().min(1).max(100).default(50),
    rating: zod_1.z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    fuel: zod_1.z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
});
exports.certificateSearchSchema = certificateSearchSchema;
// Response schemas
const leadSchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    postcode: zod_1.z.string(),
    current_energy_rating: zod_1.z.string(),
    main_fuel: zod_1.z.string(),
});
exports.leadSchema = leadSchema;
const certificateSchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    postcode: zod_1.z.string(),
    current_energy_rating: zod_1.z.string(),
    main_fuel: zod_1.z.string(),
    property_type: zod_1.z.string(),
    total_floor_area: zod_1.z.number().nullable(),
    number_habitable_rooms: zod_1.z.number().nullable(),
    construction_age_band: zod_1.z.string(),
    current_energy_efficiency: zod_1.z.number().nullable(),
});
exports.certificateSchema = certificateSchema;
const searchLeadsResponseSchema = zod_1.z.object({
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    totalCount: zod_1.z.number(),
    totalPages: zod_1.z.number(),
    results: zod_1.z.array(leadSchema),
});
exports.searchLeadsResponseSchema = searchLeadsResponseSchema;
const certificatesResponseSchema = zod_1.z.object({
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    totalCount: zod_1.z.number(),
    totalPages: zod_1.z.number(),
    certificates: zod_1.z.array(certificateSchema),
});
exports.certificatesResponseSchema = certificatesResponseSchema;
const marketStatsSchema = zod_1.z.array(zod_1.z.object({
    postcode_prefix: zod_1.z.string(),
    current_energy_rating: zod_1.z.string(),
    count: zod_1.z.string(), // PostgreSQL COUNT returns string
}));
exports.marketStatsSchema = marketStatsSchema;
const propertyScoreResponseSchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    score: zod_1.z.number(),
    current_energy_rating: zod_1.z.string(),
    main_fuel: zod_1.z.string(),
});
exports.propertyScoreResponseSchema = propertyScoreResponseSchema;
const healthResponseSchema = zod_1.z.object({
    status: zod_1.z.string(),
    uptime: zod_1.z.number(),
});
exports.healthResponseSchema = healthResponseSchema;
