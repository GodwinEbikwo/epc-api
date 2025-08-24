# EPC Lead Generation Platform

> Bloomberg Terminal for Boiler Lead Generation - AI-powered property energy intelligence platform that transforms UK government EPC data into high-value leads.

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Development Setup

1. **Install dependencies**
   ```bash
   pnpm install
   pnpm install:backend
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```
   
   This runs both:
   - Frontend: http://localhost:3000 (Next.js)
   - Backend API: http://localhost:3001 (Express.js)

### Individual Commands

```bash
# Frontend only
pnpm dev:frontend

# Backend only  
pnpm dev:backend

# Build both
pnpm build

# Linting
pnpm lint
```

## Project Structure

```
├── app/                 # Next.js App Router
├── components/          # Shadcn/ui components
├── backend/            # Express.js API
│   ├── index.js        # Main API server
│   └── .env           # Backend environment
├── lib/               # Frontend utilities
└── docs/              # Documentation
```

## Tech Stack

**Frontend:**
- Next.js 15 with App Router
- TypeScript + Tailwind CSS
- Shadcn/ui + Radix UI components

**Backend:**
- Express.js with PostgreSQL
- 28M+ UK property certificates
- 108M+ improvement recommendations
- Comprehensive API endpoints for lead generation

**Infrastructure:**
- Database: PostgreSQL on Hetzner VPS
- Deployment: Docker + Coolify
- Frontend: Vercel (recommended)

## API Endpoints

- `POST /api/leads/search` - Property search with filters
- `GET /api/leads/export` - CSV export
- `GET /api/stats/market` - Market statistics
- `POST /api/properties/score` - Lead scoring
- `GET /health` - Health check

## Business Context

Targeting the UK's **15.8M properties** with poor energy ratings (D-G) that need upgrades. The platform serves boiler installers, heat pump companies, and energy efficiency specialists with intelligent lead generation.

**Market Opportunity:**
- 17.4M properties on mains gas (prime boiler targets)
- Average 4+ improvement opportunities per property
- Government scheme integration potential (ECO4, BUS, LAD)

---

For detailed development guidelines, see [CLAUDE.md](./CLAUDE.md)