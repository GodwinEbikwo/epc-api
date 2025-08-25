import { initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Pool } from 'pg';
import { Parser } from 'json2csv';
import pino from 'pino';
import {
  searchLeadsParamsSchema,
  leadScoreParamsSchema,
  exportLeadsParamsSchema,
  certificateSearchSchema,
  searchLeadsResponseSchema,
  certificatesResponseSchema,
  marketStatsSchema,
  propertyScoreResponseSchema,
  healthResponseSchema,
} from './schemas';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/* ---------- 1. Context ---------- */
export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  req,
  res,
});
type Context = Awaited<ReturnType<typeof createContext>>;

/* ---------- 2. tRPC setup ---------- */
const t = initTRPC.context<Context>().create();
const router = t.router;
const publicProcedure = t.procedure;

/* ---------- 3. DB pool ---------- */
export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});
pool.on('error', (err) =>
  logger.error('PostgreSQL pool error: %s', err.message)
);

/* ---------- 4. Router ---------- */
export const appRouter = router({
  health: router({
    check: publicProcedure
      .output(healthResponseSchema)
      .query(() => ({
        status: 'ok',
        uptime: process.uptime(),
      })),
  }),

  leads: router({
    search: publicProcedure
      .input(searchLeadsParamsSchema)
      .output(searchLeadsResponseSchema)
      .query(async ({ input }) => {
        const { postcode, rating, fuel, page = 1, pageSize = 50 } = input;
        let baseQuery = 'FROM certificates_stg WHERE 1=1';
        const params: any[] = [];

        if (postcode) {
          const upperPostcode = postcode.toUpperCase();
          params.push(upperPostcode, upperPostcode + 'Z');
          baseQuery += ` AND postcode >= $${
            params.length - 1
          } AND postcode < $${params.length}`;
        }
        if (rating) {
          params.push(rating);
          baseQuery += ` AND current_energy_rating = $${params.length}`;
        }
        if (fuel) {
          params.push(`%${fuel}%`);
          baseQuery += ` AND main_fuel ILIKE $${params.length}`;
        }

        const limit = Math.min(pageSize, 100);
        const offset = (page - 1) * limit;

        const dataQuery = `
          SELECT lmk_key, postcode, current_energy_rating, main_fuel
          ${baseQuery}
          LIMIT ${limit} OFFSET ${offset}
        `;
        const result = await pool.query(dataQuery, params);

        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const countResult = await pool.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count, 10);

        return {
          page,
          pageSize: limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          results: result.rows,
        };
      }),

    export: publicProcedure
      .input(exportLeadsParamsSchema)
      .query(async ({ input, ctx }) => {
        const { postcode, rating, fuel, limit = 100 } = input;
        let query =
          'SELECT lmk_key, postcode, current_energy_rating, main_fuel FROM certificates_stg WHERE 1=1';
        const params: any[] = [];

        if (postcode) {
          const upperPostcode = postcode.toUpperCase();
          params.push(upperPostcode, upperPostcode + 'Z');
          query += ` AND postcode >= $${
            params.length - 1
          } AND postcode < $${params.length}`;
        }
        if (rating) {
          params.push(rating);
          query += ` AND current_energy_rating = $${params.length}`;
        }
        if (fuel) {
          params.push(`%${fuel}%`);
          query += ` AND main_fuel ILIKE $${params.length}`;
        }

        query += ` LIMIT ${Math.min(limit, 10000)}`;

        const result = await pool.query(query, params);
        const parser = new Parser();
        const csvData = parser.parse(result.rows);

        ctx.res.header('Content-Type', 'text/csv');
        ctx.res.attachment('leads.csv');

        return csvData;
      }),
  }),

  stats: router({
    market: publicProcedure
      .output(marketStatsSchema)
      .query(async () => {
        const result = await pool.query(`
          SELECT LEFT(postcode, 2) as postcode_prefix,
                 current_energy_rating,
                 COUNT(*) as count
          FROM certificates_stg
          GROUP BY postcode_prefix, current_energy_rating
          ORDER BY count DESC
          LIMIT 50
        `);
        return result.rows;
      }),
  }),

  properties: router({
    score: publicProcedure
      .input(leadScoreParamsSchema)
      .output(propertyScoreResponseSchema)
      .mutation(async ({ input }) => {
        const { lmk_key } = input;
        const result = await pool.query(
          'SELECT current_energy_rating, main_fuel FROM certificates_stg WHERE lmk_key = $1 LIMIT 1',
          [lmk_key]
        );

        if (result.rows.length === 0) throw new Error('Property not found');

        const { current_energy_rating, main_fuel } = result.rows[0];
        let score = 0;

        if (['E', 'F', 'G'].includes(current_energy_rating)) score += 50;
        if (main_fuel?.toLowerCase().includes('mains gas')) score += 30;
        if (current_energy_rating === 'D') score += 20;

        return { lmk_key, score, current_energy_rating, main_fuel };
      }),
  }),

  filters: router({
    getOptions: publicProcedure
      .query(async () => {
        // Get distinct property types (much faster with small limit)
        const propertyTypesResult = await pool.query(`
          SELECT DISTINCT property_type
          FROM certificates_stg 
          WHERE property_type IS NOT NULL 
          ORDER BY property_type
          LIMIT 10
        `);

        // For now, return hardcoded local government options to avoid timeout
        // These are common UK local authority and constituency codes
        const commonLocalAuthorities = [
          'E06000001', 'E06000002', 'E06000003', 'E06000004', 'E06000005',
          'E07000001', 'E07000002', 'E07000003', 'E07000004', 'E07000005',
          'E08000001', 'E08000002', 'E08000003', 'E08000004', 'E08000005'
        ];
        
        const commonConstituencies = [
          'E14000530', 'E14000531', 'E14000532', 'E14000533', 'E14000534',
          'E14000535', 'E14000536', 'E14000537', 'E14000538', 'E14000539',
          'E14000540', 'E14000541', 'E14000542', 'E14000543', 'E14000544'
        ];

        return {
          propertyTypes: propertyTypesResult.rows.map(row => row.property_type),
          localAuthorities: commonLocalAuthorities,
          constituencies: commonConstituencies,
          floorAreaRanges: ['unknown', '1-55m²', '55-70m²', '70-85m²', '85-110m²', '110m+']
        };
      }),
  }),

  certificates: router({
    getByPostcode: publicProcedure
      .input(certificateSearchSchema)
      .output(certificatesResponseSchema)
      .query(async ({ input }) => {
        const { postcode, rating, fuel, page = 1, pageSize = 50 } = input;
        let baseQuery = 'FROM certificates_stg WHERE 1=1';
        const params: any[] = [];

        const upperPostcode = postcode.toUpperCase();
        params.push(upperPostcode, upperPostcode + 'Z');
        baseQuery += ` AND postcode >= $${
          params.length - 1
        } AND postcode < $${params.length}`;

        if (rating) {
          params.push(rating);
          baseQuery += ` AND current_energy_rating = $${params.length}`;
        }
        if (fuel) {
          params.push(`%${fuel}%`);
          baseQuery += ` AND main_fuel ILIKE $${params.length}`;
        }

        const limit = Math.min(pageSize, 100);
        const offset = (page - 1) * limit;

        const dataQuery = `
          SELECT lmk_key, postcode, current_energy_rating, main_fuel,
                 property_type, total_floor_area, number_habitable_rooms,
                 construction_age_band, current_energy_efficiency
          ${baseQuery}
          ORDER BY postcode
          LIMIT ${limit} OFFSET ${offset}
        `;
        const result = await pool.query(dataQuery, params);

        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const countResult = await pool.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count, 10);

        return {
          page,
          pageSize: limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          certificates: result.rows,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

/* ---------- 5. Graceful shutdown ---------- */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database pool');
  await pool.end();
});