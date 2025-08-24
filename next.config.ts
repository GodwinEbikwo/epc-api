import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that should not be bundled by Next.js
  serverExternalPackages: ['@duckdb/node-api', '@duckdb/node-bindings', 'duckdb', 'duckdb-async']
};

export default nextConfig;
