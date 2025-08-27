# pgai + Ollama Setup Instructions

## 🚀 Quick Start

Your backend now includes AI-powered semantic search using pgai + Ollama (local embeddings).

### What Was Added

1. **TimescaleDB + pgai**: Upgraded from PostgreSQL 15 to TimescaleDB with AI extensions
2. **Ollama Service**: Local embedding generation (no API costs)  
3. **AI API Endpoints**: New tRPC routes for semantic search

### 🐳 Docker Setup

The `docker-compose.yml` now includes:
- **TimescaleDB container** with pgai extensions
- **Ollama container** for local embeddings
- **Automatic initialization** via SQL + shell scripts

### 📡 New API Endpoints

#### Test Embedding
```typescript
// Test if embedding generation works
const result = await trpc.ai.testEmbedding.query({
  text: "3-bedroom house, D energy rating, gas heating"
});
```

#### AI Health Check  
```typescript
// Check if pgai and Ollama are ready
const health = await trpc.ai.healthCheck.query();
```

#### Semantic Search
```typescript  
// Search properties using natural language
const results = await trpc.ai.semanticSearch.query({
  query: "energy inefficient Victorian houses needing new boilers",
  postcode: "SW", // optional
  limit: 10
});
```

#### Find Similar Properties
```typescript
// Find properties similar to a reference property
const similar = await trpc.ai.findSimilar.query({
  lmk_key: "some-property-key",
  limit: 5
});
```

## 🔧 Deployment Steps

### 1. Push Code Changes
```bash
git add .
git commit -m "Add pgai + Ollama AI search capabilities"
git push
```

### 2. Deploy via Coolify
- Coolify will rebuild containers using new docker-compose.yml
- TimescaleDB + pgai will initialize automatically
- Ollama will download the embedding model (~2-3GB)

### 3. Verify Installation (SSH)
```bash
# Access your container
ssh your-server
docker exec -it coolify-db psql -U epc_user -d epcdb

# Test pgai installation
SELECT test_pgai_installation();

# Test Ollama embedding
SELECT ai.ollama_embed('nomic-embed-text', 'test property description');
```

### 4. Create Property Embeddings (One-time setup)
```sql
-- Create vectorizer for SW London properties
SELECT ai.create_vectorizer(
    'certificates_stg'::regclass,
    destination => 'sw_property_embeddings',
    embedding => ai.embedding_ollama('nomic-embed-text', 768),
    chunking => ai.chunking_character_text_splitter(
        CONCAT(
            'Property Type: ', COALESCE(property_type, 'Unknown'),
            ', Energy Rating: ', COALESCE(current_energy_rating, 'Unknown'), 
            ', Fuel: ', COALESCE(main_fuel, 'Unknown'),
            ', Floor Area: ', COALESCE(total_floor_area::text, 'Unknown'),
            ', Construction: ', COALESCE(construction_age_band, 'Unknown')
        )
    )
) WHERE postcode LIKE 'SW%';
```

## 💰 Cost & Resource Impact

### Zero API Costs
- **Ollama runs locally** = no OpenAI/API fees
- **Test with £0 budget** = perfect for proof of concept

### Resource Usage  
- **Additional RAM**: ~4-6GB for Ollama + embedding model
- **Storage**: +3GB for nomic-embed-text model
- **CPU**: Higher usage during embedding generation
- **Your 32GB VPS**: Can easily handle this load

## 🎯 Testing the AI Features

### 1. Health Check
Visit: `https://api.heatsignal.co.uk/trpc/ai.healthCheck`

### 2. Test Embedding
```bash
curl -X POST https://api.heatsignal.co.uk/trpc/ai.testEmbedding \
  -H "Content-Type: application/json" \
  -d '{"text": "Victorian terrace house, E energy rating, gas boiler"}'
```

### 3. Semantic Search
Once embeddings are created, test natural language search:
```bash
curl -X POST https://api.heatsignal.co.uk/trpc/ai.semanticSearch \
  -H "Content-Type: application/json" \
  -d '{"query": "houses similar to successful boiler installations", "limit": 5}'
```

## 🚨 Troubleshooting

### Ollama Not Ready
- Container may take 5-10 minutes to download model on first run
- Check: `docker logs ollama-service`
- Restart if needed: `docker restart ollama-service`

### pgai Extension Issues
- Verify extensions: `\dx` in PostgreSQL
- Check logs: `docker logs coolify-db`
- Manual installation: `CREATE EXTENSION ai CASCADE;`

### Embedding Generation Fails
- Check Ollama health: `curl http://ollama-service:11434/api/version`
- Verify model download: `docker exec ollama-service ollama list`
- Test connection: `SELECT ai.ollama_embed('nomic-embed-text', 'test');`

## 🔄 Next Steps

1. **Deploy and test health endpoints**
2. **Create embeddings for SW London postcodes** (~20K properties)
3. **Test semantic search quality** vs traditional filters
4. **Scale to more London areas** if successful
5. **Consider OpenAI upgrade** if local quality insufficient

Your EPC platform now has AI-powered property intelligence! 🧠✨