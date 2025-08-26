'use client';

import { trpc } from '@/lib/trpc';
import { useSearchParams } from '@/lib/search-params';
import { useDebouncedSearch } from '@/lib/use-debounced-search';
import {
  ENERGY_RATINGS,
  FUEL_TYPES,
  PROPERTY_TYPES,
  ENERGY_RATING_LABELS,
  FUEL_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  DEFAULT_PAGE_SIZE,
  type EnergyRating,
  type FuelType,
  type PropertyType
} from '@/lib/constants';
import { PropertyListSkeleton } from '@/components/property-card-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { SearchFilters } from '@/components/search-filters';

export default function SearchPage() {
  const [nuqsParams, setNuqsParams] = useSearchParams();

  // Use debounced search for better UX
  const { searchParams, debouncedParams, setSearchParams } = useDebouncedSearch(nuqsParams);


  const hasSearchCriteria = !!(
    debouncedParams.postcode || 
    debouncedParams.rating || 
    debouncedParams.fuel ||
    debouncedParams.propertyType?.length ||
    debouncedParams.localAuthority ||
    debouncedParams.constituency ||
    debouncedParams.floorArea ||
    debouncedParams.uprn
  );

  // Use tRPC query with debounced params to avoid excessive API calls
  const { data, isLoading, error, refetch, isRefetching } = trpc.leads.search.useQuery({
    postcode: debouncedParams.postcode || undefined,
    rating: debouncedParams.rating ? (debouncedParams.rating as EnergyRating) : undefined,
    fuel: debouncedParams.fuel ? (debouncedParams.fuel as FuelType) : undefined,
    propertyType: debouncedParams.propertyType?.length ? debouncedParams.propertyType : undefined,
    localAuthority: debouncedParams.localAuthority || undefined,
    constituency: debouncedParams.constituency || undefined,
    floorArea: debouncedParams.floorArea || undefined,
    uprn: debouncedParams.uprn || undefined,
    cursor: null,
    pageSize: DEFAULT_PAGE_SIZE,
  }, {
    enabled: hasSearchCriteria,
    retry: 2,
    retryDelay: 1000,
  });

  const getCurrentSearchQuery = () => {
    const parts = [];
    if (debouncedParams.postcode) parts.push(debouncedParams.postcode);
    if (debouncedParams.rating) parts.push(`${ENERGY_RATING_LABELS[debouncedParams.rating as EnergyRating]} rating`);
    if (debouncedParams.fuel) parts.push(`${FUEL_TYPE_LABELS[debouncedParams.fuel as FuelType]} fuel`);
    return parts.join(', ');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar - Filters */}
      <div className="w-80">
        <SearchFilters 
          searchParams={searchParams}
          onParamsChange={(params) => {
            setSearchParams(params);
            setNuqsParams(params);
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-card">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Search Results</h1>

        {/* Results */}
      {!hasSearchCriteria && (
        <EmptyState type="no-search" />
      )}

      {hasSearchCriteria && isLoading && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">
              Searching properties... This may take a few seconds for large areas.
            </span>
          </div>
          <PropertyListSkeleton />
        </div>
      )}

      {hasSearchCriteria && error && (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {hasSearchCriteria && data && data.results.length === 0 && (
        <EmptyState
          type="no-results"
          searchQuery={getCurrentSearchQuery()}
        />
      )}

      {data && data.results.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {data.results.length} results
              {data.nextCursor && ' (more available)'}
            </p>
          </div>

          <div className="grid gap-4">
            {data.results.map((property: any) => (
              <div key={property.lmk_key} className="border rounded p-4">
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <li>
                    <span className="font-medium">Postcode:</span> {property.postcode}
                  </li>
                  <li>
                    <span className="font-medium">Rating:</span> {property.current_energy_rating}
                  </li>
                  <li>
                    <span className="font-medium">Fuel:</span> {property.main_fuel}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}