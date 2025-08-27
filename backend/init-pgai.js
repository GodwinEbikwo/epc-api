#!/usr/bin/env node

const { Pool } = require('pg');
const { spawn } = require('child_process');

// Database connection using environment variables
const pool = new Pool({
  user: process.env.PGUSER || 'epc_user',
  host: process.env.PGHOST || 'coolify-db',
  database: process.env.PGDATABASE || 'epcdb',
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
});

async function installPgai() {
  console.log('🤖 Installing pgai into existing PostgreSQL database...');
  
  try {
    // Check if we can connect to the database
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if pgvector extension exists, if not install it
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension ready');
    } catch (err) {
      console.log('⚠️ pgvector extension not available - AI features will use basic similarity');
    }
    
    // Check if pgai is already installed
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'ai'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ pgai already installed');
      client.release();
      return;
    }
    
    client.release();
    
    // Install pgai using Python
    const dbUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    
    console.log('📦 Installing pgai database components...');
    const pythonProcess = spawn('python3', ['-c', `
import pgai
pgai.install("${dbUrl}")
print("✅ pgai installation completed")
    `], { stdio: 'pipe' });
    
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString().trim());
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(data.toString().trim());
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('🎉 pgai installation successful!');
          resolve();
        } else {
          console.error('❌ pgai installation failed:', error);
          reject(new Error(`pgai installation failed with code ${code}: ${error}`));
        }
      });
    });
    
  } catch (err) {
    console.error('❌ pgai installation error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run installation if called directly
if (require.main === module) {
  installPgai()
    .then(() => {
      console.log('🚀 Ready to use AI features!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Installation failed:', err.message);
      process.exit(1);
    });
}

module.exports = { installPgai };