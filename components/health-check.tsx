'use client';

import { trpc } from '@/lib/trpc';

export function HealthCheck() {
  const { data, isLoading, error } = trpc.health.check.useQuery();

  if (isLoading) return <div>Checking API health...</div>;
  
  if (error) return (
    <div className="text-red-600">
      API Error: {error.message}
    </div>
  );

  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium">API Status</h3>
      <div className="text-sm text-gray-600 mt-1">
        Status: <span className="text-green-600">{data?.status}</span>
      </div>
      <div className="text-sm text-gray-600">
        Uptime: {data?.uptime ? Math.floor(data.uptime / 60) : 0} minutes
      </div>
    </div>
  );
}