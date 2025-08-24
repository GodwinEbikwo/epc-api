'use client';

import { trpc } from '@/lib/trpc';
import { useSearchParams } from '@/lib/search-params';
import {
  ENERGY_RATINGS,
  FUEL_TYPES,
  ENERGY_RATING_LABELS,
  FUEL_TYPE_LABELS,
  DEFAULT_PAGE_SIZE,
  type EnergyRating,
  type FuelType
} from '@/lib/constants';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Use tRPC query with nuqs params
  const { data, isLoading, error } = trpc.leads.search.useQuery({
    postcode: searchParams.postcode || undefined,
    rating: searchParams.rating ? (searchParams.rating as EnergyRating) : undefined,
    fuel: searchParams.fuel ? (searchParams.fuel as FuelType) : undefined,
    page: searchParams.page,
    pageSize: DEFAULT_PAGE_SIZE,
  }, {
    enabled: !!searchParams.postcode || !!searchParams.rating || !!searchParams.fuel,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Property Search</h1>

      {/* Search Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Postcode</label>
          <input
            type="text"
            value={searchParams.postcode}
            onChange={(e) => setSearchParams({ postcode: e.target.value, page: 1 })}
            placeholder="e.g. SW1A 1AA (be specific for faster results)"
            className="border rounded px-3 py-2 w-full max-w-xs"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Use full postcodes (e.g. SW1A 1AA) for faster results than prefixes (e.g. SW)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Energy Rating</label>
          <select
            value={searchParams.rating}
            onChange={(e) => setSearchParams({ rating: e.target.value, page: 1 })}
            className="border rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="">All Ratings</option>
            {ENERGY_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {ENERGY_RATING_LABELS[rating]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fuel Type</label>
          <select
            value={searchParams.fuel}
            onChange={(e) => setSearchParams({ fuel: e.target.value, page: 1 })}
            className="border rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="">All Fuel Types</option>
            {FUEL_TYPES.map((fuel) => (
              <option key={fuel} value={fuel}>
                {FUEL_TYPE_LABELS[fuel]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Searching properties... This may take a few seconds for large areas.</span>
        </div>
      )}

      {error && (
        <div className="text-red-600">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Page {data.page} of {data.totalPages}
              ({data.totalCount.toLocaleString()} total results)
            </p>
          </div>

          <div className="grid gap-4">
            {data.results.map((property: any) => (
              <div key={property.lmk_key} className="border rounded p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Postcode:</span> {property.postcode}
                  </div>
                  <div>
                    <span className="font-medium">Rating:</span> {property.current_energy_rating}
                  </div>
                  <div>
                    <span className="font-medium">Fuel:</span> {property.main_fuel}
                  </div>
                  <div>
                    <span className="font-medium">Key:</span> {property.lmk_key}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex gap-2 mt-6">
              <button
                disabled={data.page <= 1}
                onClick={() => setSearchParams({ page: data.page - 1 })}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-3 py-1">
                Page {data.page} of {data.totalPages}
              </span>

              <button
                disabled={data.page >= data.totalPages}
                onClick={() => setSearchParams({ page: data.page + 1 })}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}