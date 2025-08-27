"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semanticSearchResponseSchema = exports.embeddingResponseSchema = exports.propertyWithSimilaritySchema = exports.findSimilarSchema = exports.semanticSearchSchema = exports.testEmbeddingSchema = exports.healthResponseSchema = exports.propertyScoreResponseSchema = exports.marketStatsSchema = exports.certificatesResponseSchema = exports.searchLeadsResponseSchema = exports.certificateSchema = exports.leadSchema = exports.certificateSearchSchema = exports.exportLeadsParamsSchema = exports.leadScoreParamsSchema = exports.searchLeadsParamsSchema = void 0;
const zod_1 = require("zod");
const searchLeadsParamsSchema = zod_1.z.object({
    postcode: zod_1.z.string().optional(),
    rating: zod_1.z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    fuel: zod_1.z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
    propertyType: zod_1.z.array(zod_1.z.string()).optional(),
    localAuthority: zod_1.z.string().optional(),
    constituency: zod_1.z.string().optional(),
    floorArea: zod_1.z.string().optional(),
    uprn: zod_1.z.string().optional(),
    cursor: zod_1.z.string().nullish(),
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
    cursor: zod_1.z.string().nullish(),
    pageSize: zod_1.z.number().min(1).max(100).default(50),
    rating: zod_1.z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    fuel: zod_1.z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
});
exports.certificateSearchSchema = certificateSearchSchema;
// Response schemas
const leadSchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    postcode: zod_1.z.string(),
    current_energy_rating: zod_1.z.string().nullable(),
    main_fuel: zod_1.z.string().nullable(),
});
exports.leadSchema = leadSchema;
const certificateSchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    postcode: zod_1.z.string(),
    current_energy_rating: zod_1.z.string().nullable(),
    main_fuel: zod_1.z.string().nullable(),
    property_type: zod_1.z.string().nullable(),
    total_floor_area: zod_1.z.number().nullable(),
    number_habitable_rooms: zod_1.z.number().nullable(),
    construction_age_band: zod_1.z.string().nullable(),
    current_energy_efficiency: zod_1.z.number().nullable(),
});
exports.certificateSchema = certificateSchema;
const searchLeadsResponseSchema = zod_1.z.object({
    nextCursor: zod_1.z.string().nullish(),
    results: zod_1.z.array(leadSchema),
});
exports.searchLeadsResponseSchema = searchLeadsResponseSchema;
const certificatesResponseSchema = zod_1.z.object({
    nextCursor: zod_1.z.string().nullish(),
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
// AI-related schemas
const testEmbeddingSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, 'Text is required for embedding'),
});
exports.testEmbeddingSchema = testEmbeddingSchema;
const semanticSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query is required'),
    postcode: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(50).default(10),
    similarity_threshold: zod_1.z.number().min(0).max(1).default(0.8),
});
exports.semanticSearchSchema = semanticSearchSchema;
const findSimilarSchema = zod_1.z.object({
    lmk_key: zod_1.z.string().min(1, 'Property key is required'),
    limit: zod_1.z.number().min(1).max(20).default(5),
    similarity_threshold: zod_1.z.number().min(0).max(1).default(0.7),
});
exports.findSimilarSchema = findSimilarSchema;
const propertyWithSimilaritySchema = zod_1.z.object({
    lmk_key: zod_1.z.string(),
    postcode: zod_1.z.string(),
    current_energy_rating: zod_1.z.string().nullable(),
    main_fuel: zod_1.z.string().nullable(),
    property_type: zod_1.z.string().nullable(),
    total_floor_area: zod_1.z.number().nullable(),
    construction_age_band: zod_1.z.string().nullable(),
    similarity: zod_1.z.number().min(0).max(1),
});
exports.propertyWithSimilaritySchema = propertyWithSimilaritySchema;
const embeddingResponseSchema = zod_1.z.object({
    text: zod_1.z.string(),
    embedding: zod_1.z.array(zod_1.z.number()),
    dimensions: zod_1.z.number(),
});
exports.embeddingResponseSchema = embeddingResponseSchema;
const semanticSearchResponseSchema = zod_1.z.object({
    results: zod_1.z.array(propertyWithSimilaritySchema),
    query: zod_1.z.string(),
    total_results: zod_1.z.number(),
});
exports.semanticSearchResponseSchema = semanticSearchResponseSchema;
