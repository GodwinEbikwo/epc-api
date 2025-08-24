import { z } from 'zod';

const searchLeadsParamsSchema = z.object({
  postcode: z.string().optional(),
  rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  fuel: z.enum(['mains gas (not community)', 'electricity', 'oil', 'LPG', 'solid fuel']).optional(),
  page: z.number().min(1).default(1),
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
  page: z.number().min(1).default(1),
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
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  results: z.array(leadSchema),
});

const certificatesResponseSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  certificates: z.array(certificateSchema),
});

const marketStatsSchema = z.array(z.object({
  postcode_prefix: z.string(),
  current_energy_rating: z.string(),
  count: z.string(), // PostgreSQL COUNT returns string
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
};