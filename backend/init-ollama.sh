#!/bin/bash
# Ollama initialization script
# This script sets up Ollama models after the container starts

set -e

echo "Starting Ollama initialization..."

# Wait for Ollama service to be available
wait_for_ollama() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://ollama-service:11434/api/version > /dev/null 2>&1; then
            echo "Ollama service is ready!"
            return 0
        fi
        
        echo "Waiting for Ollama service... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: Ollama service did not become ready in time"
    return 1
}

# Download embedding model
setup_embedding_model() {
    echo "Downloading nomic-embed-text model..."
    
    # Pull the embedding model
    curl -X POST http://ollama-service:11434/api/pull \
        -H "Content-Type: application/json" \
        -d '{"name": "nomic-embed-text"}' || {
        echo "Failed to download nomic-embed-text model"
        return 1
    }
    
    echo "Model downloaded successfully!"
    return 0
}

# Configure pgai to use Ollama
configure_pgai_ollama() {
    echo "Configuring pgai to use Ollama..."
    
    # Connect to PostgreSQL and configure Ollama endpoint
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'EOF'
-- Configure Ollama connection for pgai
-- Note: This sets the Ollama host for the ai extension
SELECT ai.ollama_generate('llama3.2:1b', 'Hello from pgai!') AS test_connection;

-- Test embedding generation
SELECT ai.ollama_embed('nomic-embed-text', 'This is a test embedding for property data') AS test_embedding;

-- Log successful configuration
INSERT INTO embedding_test (text_content, embedding) 
VALUES (
    'Test property: 3-bedroom house, D energy rating, gas heating', 
    ai.ollama_embed('nomic-embed-text', 'Test property: 3-bedroom house, D energy rating, gas heating')
);

EOF

    if [ $? -eq 0 ]; then
        echo "pgai configured successfully with Ollama!"
        return 0
    else
        echo "ERROR: Failed to configure pgai with Ollama"
        return 1
    fi
}

# Main execution
main() {
    echo "=== Ollama Initialization Starting ==="
    
    # Only run if we're in the initialization phase
    if [ -f "/var/lib/postgresql/data/PG_VERSION" ] && [ ! -f "/var/lib/postgresql/data/.ollama_initialized" ]; then
        echo "Running Ollama setup..."
        
        wait_for_ollama && \
        setup_embedding_model && \
        configure_pgai_ollama && \
        touch "/var/lib/postgresql/data/.ollama_initialized" && \
        echo "=== Ollama Initialization Complete ==="
    else
        echo "Ollama already initialized or database not ready, skipping..."
    fi
}

# Run in background so it doesn't block PostgreSQL startup
main &

exit 0