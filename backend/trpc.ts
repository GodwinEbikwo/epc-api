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

/* ---------- 4. Helper for dynamic query building ---------- */
const floorAreaConditions: Record<string, string> = {
  '1-55m²': 'total_floor_area BETWEEN 1 AND 55',
  '55-70m²': 'total_floor_area BETWEEN 55 AND 70',
  '70-85m²': 'total_floor_area BETWEEN 70 AND 85',
  '85-110m²': 'total_floor_area BETWEEN 85 AND 110',
  '110m+': 'total_floor_area > 110',
  'unknown': 'total_floor_area IS NULL OR total_floor_area = 0',
};

const buildWhereClause = (input: any) => {
  const {
    postcode, rating, fuel, propertyType, localAuthority,
    constituency, floorArea, uprn, cursor,
  } = input;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  const addCondition = (clause: string, ...values: any[]) => {
    params.push(...values);
    // Adjust parameter placeholders based on the current length of the params array
    const placeholderClause = clause.replace(/\$(\d)/g, (_, n) => `$${params.length - values.length + parseInt(n)}`);
    conditions.push(placeholderClause);
  };

  if (postcode) {
    const upperPostcode = postcode.toUpperCase();
    addCondition('postcode >= $1 AND postcode < $2', upperPostcode, upperPostcode + 'Z');
  }
  if (rating) addCondition('current_energy_rating = $1', rating);
  if (fuel) addCondition('main_fuel ILIKE $1', `%${fuel}%`);
  if (propertyType && propertyType.length > 0) {
    const placeholders: string = propertyType.map((_: string, i: number) => `$${i + 1}`).join(', ');
    addCondition(`property_type IN (${placeholders})`, ...propertyType);
  }
  if (localAuthority) addCondition('local_authority = $1', localAuthority);
  if (constituency) addCondition('constituency = $1', constituency);
  if (uprn) addCondition('uprn = $1', uprn);
  if (floorArea && floorAreaConditions[floorArea]) {
    conditions.push(floorAreaConditions[floorArea]);
  }
  // Keyset pagination: fetch records after the cursor
  if (cursor) addCondition('lmk_key > $1', cursor);

  return { whereClause: `WHERE ${conditions.join(' AND ')}`, params };
};

/* ---------- 5. Router ---------- */
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
      // IMPORTANT: The input schema must accept an optional 'cursor' (string) and not require 'page'
      .input(searchLeadsParamsSchema)
      // IMPORTANT: The output schema should return 'results' and an optional 'nextCursor' (string)
      .output(searchLeadsResponseSchema)
      .query(async ({ input }) => {
        const { pageSize = 50 } = input;
        const limit = Math.min(pageSize, 100);

        const { whereClause, params } = buildWhereClause(input);

        const dataQuery = `
          SELECT lmk_key, postcode, current_energy_rating, main_fuel
          FROM certificates_stg
          ${whereClause}
          ORDER BY lmk_key -- Keyset pagination requires a stable, unique order
          LIMIT ${limit + 1} -- Fetch one extra record to determine if there's a next page
        `;
        const result = await pool.query(dataQuery, params);

        let nextCursor: string | null = null;
        if (result.rows.length > limit) {
          const lastItem = result.rows.pop(); // Remove the extra record
          nextCursor = lastItem.lmk_key;
        }

        return {
          results: result.rows,
          nextCursor,
        };
      }),

  export: publicProcedure
    .input(exportLeadsParamsSchema)
    .query(async ({ input, ctx }) => {
      const { limit = 1000 } = input;
      const { whereClause, params } = buildWhereClause(input);

      const query = `
        SELECT lmk_key, postcode, current_energy_rating, main_fuel 
        FROM certificates_stg
        ${whereClause}
        ORDER BY lmk_key
        LIMIT ${Math.min(limit, 10000)}
      `;

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
        // NOTE: These queries can be slow on very large tables without indexes.
        const [propertyTypesResult, localAuthoritiesResult, constituenciesResult] = await Promise.all([
            pool.query(`SELECT DISTINCT property_type FROM certificates_stg WHERE property_type IS NOT NULL ORDER BY property_type`),
            pool.query(`SELECT DISTINCT local_authority FROM certificates_stg WHERE local_authority IS NOT NULL ORDER BY local_authority`),
            pool.query(`SELECT DISTINCT constituency FROM certificates_stg WHERE constituency IS NOT NULL ORDER BY constituency`),
        ]);

        return {
          propertyTypes: propertyTypesResult.rows.map(row => row.property_type),
          // NOTE: This returns the authority CODES. The frontend will need a mapping if you want to display friendly names.
          localAuthorities: localAuthoritiesResult.rows.map(row => row.local_authority),
          constituencies: constituenciesResult.rows.map(row => row.constituency),
          floorAreaRanges: ['unknown', '1-55m²', '55-70m²', '70-85m²', '85-110m²', '110m+']
        };
      }),
  }),

  certificates: router({
    getByPostcode: publicProcedure
      .input(certificateSearchSchema)
      .output(certificatesResponseSchema)
      .query(async ({ input }) => {
        const { pageSize = 50 } = input;
        const limit = Math.min(pageSize, 100);

        const { whereClause, params } = buildWhereClause(input);

        const dataQuery = `
          SELECT lmk_key, postcode, current_energy_rating, main_fuel,
                 property_type, total_floor_area, number_habitable_rooms,
                 construction_age_band, current_energy_efficiency
          ${whereClause}
          ORDER BY lmk_key
          LIMIT ${limit + 1} 
        `;
        const result = await pool.query(dataQuery, params);
        let nextCursor: string | null = null;

        if (result.rows.length > limit) {
          const lastItem = result.rows.pop();
          nextCursor = lastItem.lmk_key;
        }
        return {
          certificates: result.rows,
          nextCursor,
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