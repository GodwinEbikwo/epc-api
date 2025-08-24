# EPC Lead Generation Platform - Master Document

## 🎯 Project Vision: "Bloomberg Terminal for Boiler Lead Generation"

Building the UK's most sophisticated **AI-powered property energy intelligence platform** that transforms government EPC data into high-value leads for boiler installers and energy efficiency companies.

---

## 📊 What We've Established

### Business Opportunity
- **15.8M UK properties** with poor energy ratings (D, E, F, G) needing upgrades
- **108M improvement recommendations** across 26M properties
- **Average 4+ improvement opportunities** per property
- **Massive market**: Boiler installers, heat pump companies, insulation specialists

### Competitive Advantage
- **Complete UK dataset** - 28.2M properties with official government data
- **Real-time intelligence** - current through 2025
- **AI-powered insights** using property embeddings and semantic search
- **Government scheme integration** - ECO4, BUS, LAD qualification data

### Revenue Model Options
- **Subscription tiers**: £200-1500/month per installer company
- **Pay-per-lead**: £50-200 per qualified lead  
- **Application processing**: £300-500 per government scheme application
- **Custom analysis**: £5K-50K enterprise consulting projects

---

## 🏗️ Technical Infrastructure

### Hardware Setup
- **Hetzner VPS**: 16 vCPU, 32GB RAM, 320GB SSD (116.203.91.44)
- **Current usage**: 51GB database (plenty of room to scale)

### Tech Stack
```
Backend (VPS):
├── PostgreSQL 15 (epcdb - 28M+ certificates, 108M+ recommendations)  
├── Redis (caching + sessions)
├── Node.js/Express API
├── Background workers (Bull/BullMQ)
└── Nginx (reverse proxy + SSL)

Frontend (Vercel):
├── Next.js 14 App Router
├── TypeScript + Tailwind CSS
├── Shadcn/ui components
└── tRPC (type-safe API)

AI/ML:
├── OpenAI Embeddings (property similarity)
├── PostgreSQL pgai extension (TimescaleDB)
└── Semantic search capabilities
```

---

## 📋 Database Schema

### certificates_stg (28.2M records)
```sql
Key Fields:
├── lmk_key (primary identifier)
├── postcode, local_authority (geographic)
├── current_energy_rating, potential_energy_rating  
├── heating_cost_current, heating_cost_potential
├── main_fuel, mains_gas_flag
├── property_type, built_form
├── total_floor_area, construction_age_band
└── uprn (government property ID)
```

### recommendations_stg (108M records)
```sql
Key Fields:
├── lmk_key (links to certificates)
├── improvement_item (sequence number)
├── improvement_summary_text
├── improvement_descr_text  
├── improvement_id
└── indicative_cost
```

### Data Relationships
- **1:Many** - One property → Multiple recommendations (avg 4.15 per property)
- **26M properties** have both certificates and recommendations
- **2.2M properties** have certificates only (likely newer/better rated)

---

## ⚡ Indexes Created

### Essential Performance Indexes
```sql
Geographic Targeting:
├── idx_certs_postcode
├── idx_certs_local_authority

Lead Scoring:
├── idx_certs_current_rating  
├── idx_certs_potential_rating
├── idx_certs_heating_cost_current

Property Targeting:
├── idx_certs_property_type
├── idx_certs_main_fuel
├── idx_certs_mains_gas

Relationship Joins:
├── idx_certs_lmk_key
└── idx_recs_lmk_key

Full-Text Search:
└── idx_recs_improvement_text_search (GIN)
```

---

## ✅ What We've Accomplished

### Data Infrastructure 
- [x] **108M recommendations loaded** in 3 minutes using parallel processing
- [x] **28.2M certificates loaded** with complete UK property data
- [x] **Performance indexes created** for sub-second query response
- [x] **Database optimized** for massive scale operations

### Technical Foundation
- [x] **VPS configured** with PostgreSQL, optimized for 32GB RAM
- [x] **Data relationships mapped** between properties and recommendations  
- [x] **Query patterns tested** for lead generation use cases
- [x] **Staging environment** ready for production deployment

### Business Intelligence
- [x] **Market size quantified**: 15.8M properties need energy upgrades
- [x] **Fuel type analysis**: 16M+ properties on mains gas (prime boiler targets)
- [x] **Geographic distribution**: Complete UK coverage with postcode indexing
- [x] **Lead quality metrics**: Properties with up to 24 improvement recommendations

---

## 🚀 Next Steps

### Phase 1: MVP Development (Weeks 1-4)
**Core API Development:**
- [ ] Next.js App Router setup with authentication
- [ ] Basic property search endpoints (postcode, energy rating, fuel type)
- [ ] Simple lead scoring algorithm (no AI initially)
- [ ] CSV export functionality for leads
- [ ] User management and basic dashboard

**Questions:**
- **Geographic focus**: Start UK-wide or focus on specific regions first?
- **Pricing model**: Subscription vs pay-per-lead for initial customers?
- **Target customer size**: SME installers vs enterprise heating companies?

### Phase 2: Business Platform (Weeks 5-8)  
**Advanced Features:**
- [ ] Territory management system
- [ ] Lead assignment and tracking
- [ ] Analytics dashboard with conversion metrics
- [ ] Stripe billing integration
- [ ] Government scheme qualification checker

### Phase 3: AI Intelligence (Weeks 9-12)
**Bloomberg-Style Features:**
- [ ] OpenAI property embeddings (start with high-value postcodes)
- [ ] Semantic property search ("properties like successful conversions")
- [ ] Predictive lead scoring with conversion probability
- [ ] Market intelligence reports and trends
- [ ] Custom insights generation

**Questions:**
- **AI budget**: Start with £200/month embeddings budget or higher?
- **Geographic priority**: Which postcodes/regions for initial AI rollout?

### Phase 4: Scale & Enterprise (Month 4+)
- [ ] White-label platform for large installers
- [ ] Government integration APIs (ECO4/BUS applications)
- [ ] Advanced analytics and reporting
- [ ] Mobile app for field engineers
- [ ] Enterprise sales and custom projects

---

## 🎯 Key Questions for Next Phase

### Business Model
- **Primary customer segment**: Regional installers (50-500 engineers) vs national companies?
- **Pricing strategy**: What's the sweet spot for monthly subscriptions?
- **Geographic rollout**: London/SE focus first, or broader UK approach?

### Product Features  
- **Government scheme focus**: Which schemes should we prioritize (ECO4, BUS, LAD)?
- **Lead qualification**: What makes a "high-quality" lead in your opinion?
- **Integration needs**: CRM systems, scheduling tools, quote generators?

### Technical Priorities
- **Performance requirements**: Target response times for queries?
- **Data updates**: How often should we refresh EPC data?
- **Scaling approach**: When to move from staging to production tables?

---

## 💰 Success Metrics

### Technical KPIs
- Query response time: <100ms for filtered searches
- Database uptime: 99.9%+
- API throughput: 1000+ requests/minute

### Business KPIs 
- Customer acquisition: 10+ paying customers by Month 3
- Monthly recurring revenue: £10K+ by Month 6  
- Lead conversion rate: Track installer success rates
- Customer retention: 90%+ monthly retention

---

## 📝 Important Data Insights

### Fuel Type Distribution (Key for Targeting)
- `mains gas (not community)`: 16.2M properties (biggest opportunity)
- `mains gas (community)`: 518K properties  
- `Gas: mains gas`: 680K properties
- **Total mains gas properties**: ~17.4M (prime boiler replacement targets)

### Energy Rating Distribution
- **D rating**: 10.4M properties (biggest lead source)
- **E rating**: 4.0M properties  
- **F rating**: 1.0M properties
- **G rating**: 313K properties
- **Total poor ratings (D-G)**: 15.8M properties

### Geographic Coverage
- **SE postcodes**: 564K properties
- **SW postcodes**: 560K properties  
- **NG postcodes**: 627K properties (highest concentration)
- **Complete UK coverage** with postcode indexing

---

**This master document will evolve as we build the platform. Next immediate priority: Set up the Next.js frontend and basic API endpoints for the MVP.**

## 🔄 Document Version
- **Created**: August 22, 2025
- **Last Updated**: August 22, 2025
- **Next Review**: Weekly during development phases