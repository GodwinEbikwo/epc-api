"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = exports.pool = exports.createContext = void 0;
const server_1 = require("@trpc/server");
const pg_1 = require("pg");
const json2csv_1 = require("json2csv");
const pino_1 = __importDefault(require("pino"));
const schemas_1 = require("./schemas");
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
/* ---------- 1. Context ---------- */
const createContext = ({ req, res }) => ({
    req,
    res,
});
exports.createContext = createContext;
/* ---------- 2. tRPC setup ---------- */
const t = server_1.initTRPC.context().create();
const router = t.router;
const publicProcedure = t.procedure;
/* ---------- 3. DB pool ---------- */
exports.pool = new pg_1.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT),
});
exports.pool.on('error', (err) => logger.error('PostgreSQL pool error: %s', err.message));
/* ---------- 4. Router ---------- */
exports.appRouter = router({
    health: router({
        check: publicProcedure
            .output(schemas_1.healthResponseSchema)
            .query(() => ({
            status: 'ok',
            uptime: process.uptime(),
        })),
    }),
    leads: router({
        search: publicProcedure
            .input(schemas_1.searchLeadsParamsSchema)
            .output(schemas_1.searchLeadsResponseSchema)
            .query(async ({ input }) => {
            const { postcode, rating, fuel, page = 1, pageSize = 50 } = input;
            let baseQuery = 'FROM certificates_stg WHERE 1=1';
            const params = [];
            if (postcode) {
                params.push(postcode, postcode + 'Z');
                baseQuery += ` AND postcode >= $${params.length - 1} AND postcode < $${params.length}`;
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
            const result = await exports.pool.query(dataQuery, params);
            const countQuery = `SELECT COUNT(*) ${baseQuery}`;
            const countResult = await exports.pool.query(countQuery, params);
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
            .input(schemas_1.exportLeadsParamsSchema)
            .query(async ({ input, ctx }) => {
            const { postcode, rating, fuel, limit = 100 } = input;
            let query = 'SELECT lmk_key, postcode, current_energy_rating, main_fuel FROM certificates_stg WHERE 1=1';
            const params = [];
            if (postcode) {
                params.push(postcode, postcode + 'Z');
                query += ` AND postcode >= $${params.length - 1} AND postcode < $${params.length}`;
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
            const result = await exports.pool.query(query, params);
            const parser = new json2csv_1.Parser();
            const csvData = parser.parse(result.rows);
            ctx.res.header('Content-Type', 'text/csv');
            ctx.res.attachment('leads.csv');
            return csvData;
        }),
    }),
    stats: router({
        market: publicProcedure
            .output(schemas_1.marketStatsSchema)
            .query(async () => {
            const result = await exports.pool.query(`
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
            .input(schemas_1.leadScoreParamsSchema)
            .output(schemas_1.propertyScoreResponseSchema)
            .mutation(async ({ input }) => {
            const { lmk_key } = input;
            const result = await exports.pool.query('SELECT current_energy_rating, main_fuel FROM certificates_stg WHERE lmk_key = $1 LIMIT 1', [lmk_key]);
            if (result.rows.length === 0)
                throw new Error('Property not found');
            const { current_energy_rating, main_fuel } = result.rows[0];
            let score = 0;
            if (['E', 'F', 'G'].includes(current_energy_rating))
                score += 50;
            if (main_fuel?.toLowerCase().includes('mains gas'))
                score += 30;
            if (current_energy_rating === 'D')
                score += 20;
            return { lmk_key, score, current_energy_rating, main_fuel };
        }),
    }),
    certificates: router({
        getByPostcode: publicProcedure
            .input(schemas_1.certificateSearchSchema)
            .output(schemas_1.certificatesResponseSchema)
            .query(async ({ input }) => {
            const { postcode, rating, fuel, page = 1, pageSize = 50 } = input;
            let baseQuery = 'FROM certificates_stg WHERE 1=1';
            const params = [];
            params.push(postcode, postcode + 'Z');
            baseQuery += ` AND postcode >= $${params.length - 1} AND postcode < $${params.length}`;
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
            const result = await exports.pool.query(dataQuery, params);
            const countQuery = `SELECT COUNT(*) ${baseQuery}`;
            const countResult = await exports.pool.query(countQuery, params);
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
/* ---------- 5. Graceful shutdown ---------- */
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing database pool');
    await exports.pool.end();
});
