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
/* ---------- 4. Helper for dynamic query building ---------- */
const floorAreaConditions = {
    '1-55m²': 'total_floor_area BETWEEN 1 AND 55',
    '55-70m²': 'total_floor_area BETWEEN 55 AND 70',
    '70-85m²': 'total_floor_area BETWEEN 70 AND 85',
    '85-110m²': 'total_floor_area BETWEEN 85 AND 110',
    '110m+': 'total_floor_area > 110',
    'unknown': 'total_floor_area IS NULL OR total_floor_area = 0',
};
const buildWhereClause = (input) => {
    const { postcode, rating, fuel, propertyType, localAuthority, constituency, floorArea, uprn, cursor, } = input;
    const conditions = ['1=1'];
    const params = [];
    const addCondition = (clause, ...values) => {
        params.push(...values);
        // Adjust parameter placeholders based on the current length of the params array
        const placeholderClause = clause.replace(/\$(\d)/g, (_, n) => `$${params.length - values.length + parseInt(n)}`);
        conditions.push(placeholderClause);
    };
    if (postcode) {
        const upperPostcode = postcode.toUpperCase();
        addCondition('postcode >= $1 AND postcode < $2', upperPostcode, upperPostcode + 'Z');
    }
    if (rating)
        addCondition('current_energy_rating = $1', rating);
    if (fuel)
        addCondition('main_fuel ILIKE $1', `%${fuel}%`);
    if (propertyType && propertyType.length > 0) {
        const placeholders = propertyType.map((_, i) => `$${i + 1}`).join(', ');
        addCondition(`property_type IN (${placeholders})`, ...propertyType);
    }
    if (localAuthority)
        addCondition('local_authority = $1', localAuthority);
    if (constituency)
        addCondition('constituency = $1', constituency);
    if (uprn)
        addCondition('uprn = $1', uprn);
    if (floorArea && floorAreaConditions[floorArea]) {
        conditions.push(floorAreaConditions[floorArea]);
    }
    // Keyset pagination: fetch records after the cursor
    if (cursor)
        addCondition('lmk_key > $1', cursor);
    return { whereClause: `WHERE ${conditions.join(' AND ')}`, params };
};
/* ---------- 5. Router ---------- */
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
            // IMPORTANT: The input schema must accept an optional 'cursor' (string) and not require 'page'
            .input(schemas_1.searchLeadsParamsSchema)
            // IMPORTANT: The output schema should return 'results' and an optional 'nextCursor' (string)
            .output(schemas_1.searchLeadsResponseSchema)
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
            const result = await exports.pool.query(dataQuery, params);
            let nextCursor = null;
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
            .input(schemas_1.exportLeadsParamsSchema)
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
    filters: router({
        getOptions: publicProcedure
            .query(async () => {
            // NOTE: These queries can be slow on very large tables without indexes.
            const [propertyTypesResult, localAuthoritiesResult, constituenciesResult] = await Promise.all([
                exports.pool.query(`SELECT DISTINCT property_type FROM certificates_stg WHERE property_type IS NOT NULL ORDER BY property_type`),
                exports.pool.query(`SELECT DISTINCT local_authority FROM certificates_stg WHERE local_authority IS NOT NULL ORDER BY local_authority`),
                exports.pool.query(`SELECT DISTINCT constituency FROM certificates_stg WHERE constituency IS NOT NULL ORDER BY constituency`),
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
            .input(schemas_1.certificateSearchSchema)
            .output(schemas_1.certificatesResponseSchema)
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
            const result = await exports.pool.query(dataQuery, params);
            let nextCursor = null;
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
    ai: router({
        // Test embedding generation
        testEmbedding: publicProcedure
            .input(schemas_1.testEmbeddingSchema)
            .output(schemas_1.embeddingResponseSchema)
            .query(async ({ input }) => {
            try {
                const result = await exports.pool.query(`
            SELECT ai.ollama_embed('nomic-embed-text', $1) as embedding
          `, [input.text]);
                const embedding = result.rows[0]?.embedding || [];
                return {
                    text: input.text,
                    embedding: embedding,
                    dimensions: embedding.length,
                };
            }
            catch (error) {
                logger.error('Error generating embedding: %s', error.message);
                throw new Error('Failed to generate embedding. Please check if Ollama is running and pgai is configured properly.');
            }
        }),
        // Semantic search for properties
        semanticSearch: publicProcedure
            .input(schemas_1.semanticSearchSchema)
            .output(schemas_1.semanticSearchResponseSchema)
            .query(async ({ input }) => {
            try {
                const { query, postcode, limit, similarity_threshold } = input;
                // First, check if we have embeddings table
                const tableCheck = await exports.pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = 'sw_property_embeddings'
            );
          `);
                if (!tableCheck.rows[0].exists) {
                    throw new Error('Property embeddings not yet created. Please run the vectorizer setup first.');
                }
                const searchQuery = `
            WITH query_embedding AS (
              SELECT ai.ollama_embed('nomic-embed-text', $1) as vec
            )
            SELECT 
              c.lmk_key,
              c.postcode,
              c.current_energy_rating,
              c.main_fuel,
              c.property_type,
              c.total_floor_area,
              c.construction_age_band,
              (e.embedding <=> q.vec) as similarity
            FROM certificates_stg c
            JOIN sw_property_embeddings e ON c.lmk_key = e.lmk_key
            CROSS JOIN query_embedding q
            WHERE ($2 IS NULL OR c.postcode ILIKE $2 || '%')
              AND (e.embedding <=> q.vec) <= $4  -- similarity_threshold (lower is more similar)
            ORDER BY similarity
            LIMIT $3
          `;
                const result = await exports.pool.query(searchQuery, [
                    query,
                    postcode,
                    limit,
                    1 - similarity_threshold // Convert to distance (pgvector uses distance, not similarity)
                ]);
                return {
                    results: result.rows.map(row => ({
                        ...row,
                        similarity: 1 - row.similarity // Convert back to similarity score
                    })),
                    query: query,
                    total_results: result.rows.length,
                };
            }
            catch (error) {
                logger.error('Error in semantic search: %s', error.message);
                throw new Error(`Semantic search failed: ${error.message}`);
            }
        }),
        // Find similar properties to a given property
        findSimilar: publicProcedure
            .input(schemas_1.findSimilarSchema)
            .query(async ({ input }) => {
            try {
                const { lmk_key, limit, similarity_threshold } = input;
                // Check if embeddings table exists
                const tableCheck = await exports.pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = 'sw_property_embeddings'
            );
          `);
                if (!tableCheck.rows[0].exists) {
                    throw new Error('Property embeddings not yet created. Please run the vectorizer setup first.');
                }
                const similarQuery = `
            WITH reference_property AS (
              SELECT embedding FROM sw_property_embeddings WHERE lmk_key = $1
            )
            SELECT 
              c.lmk_key,
              c.postcode,
              c.current_energy_rating,
              c.main_fuel,
              c.property_type,
              c.total_floor_area,
              c.construction_age_band,
              (e.embedding <=> r.embedding) as similarity
            FROM certificates_stg c
            JOIN sw_property_embeddings e ON c.lmk_key = e.lmk_key
            CROSS JOIN reference_property r
            WHERE c.lmk_key != $1
              AND (e.embedding <=> r.embedding) <= $3  -- similarity threshold
            ORDER BY similarity
            LIMIT $2
          `;
                const result = await exports.pool.query(similarQuery, [
                    lmk_key,
                    limit,
                    1 - similarity_threshold
                ]);
                return result.rows.map(row => ({
                    ...row,
                    similarity: 1 - row.similarity // Convert to similarity score
                }));
            }
            catch (error) {
                logger.error('Error finding similar properties: %s', error.message);
                throw new Error(`Failed to find similar properties: ${error.message}`);
            }
        }),
        // Health check for AI services
        healthCheck: publicProcedure
            .query(async () => {
            try {
                // Test pgai extension
                const aiCheck = await exports.pool.query(`SELECT test_pgai_installation() as status`);
                // Test Ollama connection (this will fail gracefully if Ollama isn't ready)
                let ollamaStatus = 'not_ready';
                try {
                    await exports.pool.query(`SELECT ai.ollama_embed('nomic-embed-text', 'test') as test_embed`);
                    ollamaStatus = 'ready';
                }
                catch {
                    ollamaStatus = 'not_ready';
                }
                return {
                    pgai_status: aiCheck.rows[0]?.status || 'unknown',
                    ollama_status: ollamaStatus,
                    embeddings_ready: ollamaStatus === 'ready',
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                logger.error('AI health check failed: %s', error.message);
                return {
                    pgai_status: 'error',
                    ollama_status: 'error',
                    embeddings_ready: false,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                };
            }
        }),
    }),
});
/* ---------- 5. Graceful shutdown ---------- */
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing database pool');
    await exports.pool.end();
});
