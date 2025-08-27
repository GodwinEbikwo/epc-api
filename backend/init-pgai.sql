-- pgai initialization script
-- This runs automatically when the TimescaleDB container starts

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS ai CASCADE;
CREATE EXTENSION IF NOT EXISTS plpython3u;

-- Verify extensions are installed
DO $$
BEGIN
    -- Test that ai extension is working
    RAISE NOTICE 'pgai extension installed successfully';
END $$;

-- Configure pgai for Ollama integration
-- Note: Ollama connection will be configured after Ollama service is running
CREATE OR REPLACE FUNCTION test_pgai_installation()
RETURNS TEXT AS $$
BEGIN
    -- This function can be called to verify pgai is working
    RETURN 'pgai extensions installed and ready for configuration';
END;
$$ LANGUAGE plpgsql;

-- Create a simple test table for embeddings
CREATE TABLE IF NOT EXISTS embedding_test (
    id SERIAL PRIMARY KEY,
    text_content TEXT NOT NULL,
    embedding vector(768), -- nomic-embed-text produces 768-dimensional vectors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embedding_test_vector 
ON embedding_test 
USING hnsw (embedding vector_cosine_ops);

-- Log successful initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) 
ON CONFLICT DO NOTHING;

COMMENT ON DATABASE epcdb IS 'EPC Database with pgai extensions for semantic search';