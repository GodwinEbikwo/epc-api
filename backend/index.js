// index.js
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { Parser } = require("json2csv");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { z } = require("zod");

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL pool with error handler
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});
pool.on("error", (err) => logger.error("PostgreSQL pool error: %s", err.message));


function nextPrefix(prefix) {
  const lastChar = prefix.slice(-1);
  const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
  return prefix.slice(0, -1) + nextChar;
}

// ===== Middleware =====
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 req / 15 min) with proxy-aware IP
const rateLimiter = new RateLimiterMemory({ points: 100, duration: 900 });
app.use(async (req, res, next) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  try {
    await rateLimiter.consume(clientIp);
    next();
  } catch {
    res.status(429).send("Too many requests, slow down!");
  }
});

// ===== Validation helper =====
const validateBody = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: err.errors });
  }
};

// ===== Routes =====

// Root
app.get("/", (req, res) => {
  res.send("EPC API is running 🚀 with lead generation endpoints");
});

// 1. Lead Search with Pagination + validation
const leadSearchSchema = z.object({
  postcode: z.string().optional(),
  rating: z.string().optional(),
  fuel: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

app.post(
  "/api/leads/search",
  validateBody(leadSearchSchema), // middleware for request validation
  async (req, res) => {
    try {
      const { postcode, rating, fuel, page = 1, pageSize = 50 } = req.body;

      // Base query (used for both data and count)
      let baseQuery = "FROM certificates_stg WHERE 1=1";
      const params = [];

      if (postcode) {
        params.push(postcode);
        params.push(postcode + 'Z'); // Simple range for prefix search
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

      // Pagination
      const limit = Math.min(parseInt(pageSize) || 50, 100);
      const offset = ((parseInt(page) || 1) - 1) * limit;

      // Data query
      const dataQuery = `
        SELECT lmk_key, postcode, current_energy_rating, main_fuel
        ${baseQuery}
        LIMIT ${limit} OFFSET ${offset}
      `;
      const result = await pool.query(dataQuery, params);

      // Count query
      const countQuery = `SELECT COUNT(*) ${baseQuery}`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count, 10);

      // Response
      res.json({
        page: parseInt(page) || 1,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        results: result.rows,
      });
    } catch (err) {
      console.error("Lead search error:", err.message);
      res.status(500).json({
        error: "Lead search failed",
        details: err.message,
      });
    }
  }
);

// 2. Export Leads as CSV
app.get("/api/leads/export", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT lmk_key, postcode, current_energy_rating, main_fuel FROM certificates_stg LIMIT 100"
    );
    const parser = new Parser();
    const csv = parser.parse(result.rows);
    res.header("Content-Type", "text/csv");
    res.attachment("leads.csv");
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).send("CSV export failed");
  }
});

// 3. Market Stats
app.get("/api/stats/market", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT LEFT(postcode, 2) as postcode_prefix, current_energy_rating, COUNT(*) as count
      FROM certificates_stg
      GROUP BY postcode_prefix, current_energy_rating
      ORDER BY count DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).send("Market stats failed");
  }
});

// 4. Lead Scoring
app.post("/api/properties/score", async (req, res) => {
  try {
    const { lmk_key } = req.body;
    const result = await pool.query(
      "SELECT current_energy_rating, main_fuel FROM certificates_stg WHERE lmk_key = $1 LIMIT 1",
      [lmk_key]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Property not found");

    const { current_energy_rating, main_fuel } = result.rows[0];
    let score = 0;

    if (["E", "F", "G"].includes(current_energy_rating)) score += 50;
    if (main_fuel && main_fuel.toLowerCase().includes("mains gas")) score += 30;
    if (current_energy_rating === "D") score += 20;

    res.json({ lmk_key, score, current_energy_rating, main_fuel });
  } catch (err) {
    req.log.error(err);
    res.status(500).send("Scoring failed");
  }
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ===== Start server =====
app.listen(port, () => {
  logger.info(`✅ API server running on http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});
