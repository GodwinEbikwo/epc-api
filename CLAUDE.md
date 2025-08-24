# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Essential Commands:**
- `pnpm dev` - Start development server on localhost:3000
- `pnpm build` - Build production application  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks

**Package Management:**
- Use `pnpm` as the preferred package manager (lockfile present)
- Dependencies are managed in `package.json`

## Architecture Overview

**Tech Stack:**
- **Framework**: Next.js 15.4.7 with App Router
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS v4 with Shadcn/ui components
- **UI Library**: Radix UI primitives with Lucide React icons
- **Database Integration**: DuckDB configured in Next.js config for serverless compatibility

**Project Structure:**
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable UI components following Shadcn/ui patterns
  - `components/ui/` - Base UI primitives (button, card, dialog, etc.)
- `lib/` - Utility functions and shared logic
- `docs/` - Business documentation and technical specs

**Key Configurations:**
- TypeScript paths alias `@/*` maps to project root
- Shadcn/ui configured with "new-york" style, CSS variables, and slate base color
- ESLint extends Next.js core-web-vitals and TypeScript rules
- External packages excluded from bundling: DuckDB modules for serverless compatibility

## Business Context

This is an **EPC (Energy Performance Certificate) lead generation platform** designed as a "Bloomberg Terminal for Boiler Lead Generation." The platform processes UK government EPC data to generate leads for boiler installers and energy efficiency companies.

**Key Data Points:**
- 28.2M UK property certificates in PostgreSQL database
- 108M improvement recommendations 
- Target market: Properties with poor energy ratings (D, E, F, G) needing upgrades
- Geographic coverage: Complete UK with postcode indexing

**Database Architecture (External VPS):**
- PostgreSQL 15 on Hetzner VPS (116.203.91.44)
- Main tables: `certificates_stg`, `recommendations_stg` 
- Optimized for property search and lead generation queries
- DuckDB integration for serverless data processing

## Component Patterns

**UI Components:**
- Follow Shadcn/ui conventions with Radix UI primitives
- Use Tailwind CSS for styling with CSS variables for theming
- Components are typed with TypeScript and use forwardRef patterns
- Lucide React for consistent iconography

**Styling Approach:**
- Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- CSS variables defined in `app/globals.css`
- Geist font family (sans and mono variants) loaded via next/font

## Development Notes

**Font Configuration:**
- Geist Sans and Geist Mono fonts are pre-configured
- Font variables available as CSS custom properties

**State Management:**
- Uses `nuqs` for URL state management
- No global state management library currently configured

**Build Configuration:**
- Next.js configured to exclude DuckDB packages from server bundling
- TypeScript with strict mode and incremental compilation enabled