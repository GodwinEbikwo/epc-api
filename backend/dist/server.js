"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const express_2 = require("@trpc/server/adapters/express");
const trpc_1 = require("./trpc");
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
/* ---------- Middleware ---------- */
app.use((0, pino_http_1.default)({ logger }));
app.use((0, cors_1.default)({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'trpc-accept', 'Accept', 'X-Requested-With']
}));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting (100 req / 15 min) with proxy-aware IP
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({ points: 100, duration: 900 });
app.use(async (req, res, next) => {
    const clientIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip) ?? 'unknown';
    try {
        await rateLimiter.consume(clientIp);
        next();
    }
    catch {
        res.status(429).send('Too many requests, slow down!');
    }
});
/* ---------- tRPC Middleware ---------- */
app.use('/api/trpc', (0, express_2.createExpressMiddleware)({
    router: trpc_1.appRouter,
    createContext: trpc_1.createContext,
}));
/* ---------- Routes ---------- */
app.get('/', (_req, res) => {
    res.send('EPC API is running 🚀 All endpoints migrated to tRPC at /api/trpc');
});
/* ---------- Start server ---------- */
app.listen(port, () => {
    logger.info(`✅ API server running on http://localhost:${port}`);
    logger.info(`🔌 tRPC endpoints available at http://localhost:${port}/api/trpc`);
});
