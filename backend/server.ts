import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from './trpc';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

/* ---------- Middleware ---------- */
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 req / 15 min) with proxy-aware IP
const rateLimiter = new RateLimiterMemory({ points: 100, duration: 900 });
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const clientIp =
  ((req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip) ?? 'unknown';
  try {
    await rateLimiter.consume(clientIp);
    next();
  } catch {
    res.status(429).send('Too many requests, slow down!');
  }
});

/* ---------- tRPC Middleware ---------- */
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

/* ---------- Routes ---------- */
app.get('/', (_req: Request, res: Response) => {
  res.send('EPC API is running 🚀 All endpoints migrated to tRPC at /api/trpc');
});

/* ---------- Start server ---------- */
app.listen(port, () => {
  logger.info(`✅ API server running on http://localhost:${port}`);
  logger.info(
    `🔌 tRPC endpoints available at http://localhost:${port}/api/trpc`
  );
});