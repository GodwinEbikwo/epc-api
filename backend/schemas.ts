import { z } from 'zod';

const searchLeadsParamsSchema = z.object({
  postcode: z.string().optional(),
  rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  fuel: z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
  propertyType: z.array(z.string()).optional(),
  localAuthority: z.string().optional(),
  constituency: z.string().optional(),
  floorArea: z.string().optional(),
  uprn: z.string().optional(),
  cursor: z.string().nullish(),
  pageSize: z.number().min(1).max(100).default(50),
});

const leadScoreParamsSchema = z.object({
  lmk_key: z.string().min(1, 'Property key is required'),
});

const exportLeadsParamsSchema = z.object({
  postcode: z.string().optional(),
  rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  fuel: z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
  limit: z.number().min(1).max(10000).default(100),
});

const certificateSearchSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required'),
  cursor: z.string().nullish(),
  pageSize: z.number().min(1).max(100).default(50),
  rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  fuel: z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
});

// Response schemas
const leadSchema = z.object({
  lmk_key: z.string(),
  postcode: z.string(),
  current_energy_rating: z.string().nullable(),
  main_fuel: z.string().nullable(),
});

const certificateSchema = z.object({
  lmk_key: z.string(),
  postcode: z.string(),
  current_energy_rating: z.string().nullable(),
  main_fuel: z.string().nullable(),
  property_type: z.string().nullable(),
  total_floor_area: z.number().nullable(),
  number_habitable_rooms: z.number().nullable(),
  construction_age_band: z.string().nullable(),
  current_energy_efficiency: z.number().nullable(),
});

const searchLeadsResponseSchema = z.object({
  nextCursor: z.string().nullish(), 
  results: z.array(leadSchema),
});

const certificatesResponseSchema = z.object({
  nextCursor: z.string().nullish(),
  certificates: z.array(certificateSchema),
});

const marketStatsSchema = z.array(z.object({
  postcode_prefix: z.string(),
  current_energy_rating: z.string(),
  count: z.string(),  // PostgreSQL COUNT returns string
}));

const propertyScoreResponseSchema = z.object({
  lmk_key: z.string(),
  score: z.number(),
  current_energy_rating: z.string(),
  main_fuel: z.string(),
});

const healthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
});

// AI-related schemas
const testEmbeddingSchema = z.object({
  text: z.string().min(1, 'Text is required for embedding'),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  postcode: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.8),
});

const findSimilarSchema = z.object({
  lmk_key: z.string().min(1, 'Property key is required'),
  limit: z.number().min(1).max(20).default(5),
  similarity_threshold: z.number().min(0).max(1).default(0.7),
});

const propertyWithSimilaritySchema = z.object({
  lmk_key: z.string(),
  postcode: z.string(),
  current_energy_rating: z.string().nullable(),
  main_fuel: z.string().nullable(),
  property_type: z.string().nullable(),
  total_floor_area: z.number().nullable(),
  construction_age_band: z.string().nullable(),
  similarity: z.number().min(0).max(1),
});

const embeddingResponseSchema = z.object({
  text: z.string(),
  embedding: z.array(z.number()),
  dimensions: z.number(),
});

const semanticSearchResponseSchema = z.object({
  results: z.array(propertyWithSimilaritySchema),
  query: z.string(),
  total_results: z.number(),
});

export {
  searchLeadsParamsSchema,
  leadScoreParamsSchema,
  exportLeadsParamsSchema,
  certificateSearchSchema,
  leadSchema,
  certificateSchema,
  searchLeadsResponseSchema,
  certificatesResponseSchema,
  marketStatsSchema,
  propertyScoreResponseSchema,
  healthResponseSchema,
  testEmbeddingSchema,
  semanticSearchSchema,
  findSimilarSchema,
  propertyWithSimilaritySchema,
  embeddingResponseSchema,
  semanticSearchResponseSchema,
};