'use client';

import { useState, useEffect } from 'react';
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
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { SearchFilters } from '@/components/search-filters';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const [nuqsParams, setNuqsParams] = useSearchParams();

  // Use debounced search for better UX
  const { searchParams, debouncedParams, setSearchParams } = useDebouncedSearch(nuqsParams);

  // State for cursor-based pagination
  const [allResults, setAllResults] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);


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

  // Load more results query - disabled by default, enabled manually
  const loadMoreQuery = trpc.leads.search.useQuery({
    postcode: debouncedParams.postcode || undefined,
    rating: debouncedParams.rating ? (debouncedParams.rating as EnergyRating) : undefined,
    fuel: debouncedParams.fuel ? (debouncedParams.fuel as FuelType) : undefined,
    propertyType: debouncedParams.propertyType?.length ? debouncedParams.propertyType : undefined,
    localAuthority: debouncedParams.localAuthority || undefined,
    constituency: debouncedParams.constituency || undefined,
    floorArea: debouncedParams.floorArea || undefined,
    uprn: debouncedParams.uprn || undefined,
    cursor: currentCursor,
    pageSize: DEFAULT_PAGE_SIZE,
  }, {
    enabled: false, // Only run when manually triggered
    retry: 2,
    retryDelay: 1000,
  });

  // Reset accumulated results when search criteria changes
  useEffect(() => {
    if (data) {
      setAllResults(data.results);
      setCurrentCursor(data.nextCursor || null);
    }
  }, [data]);

  // Handle load more results
  useEffect(() => {
    if (loadMoreQuery.data && currentCursor) {
      setAllResults(prev => [...prev, ...loadMoreQuery.data.results]);
      setCurrentCursor(loadMoreQuery.data.nextCursor || null);
      setIsLoadingMore(false);
    }
  }, [loadMoreQuery.data, currentCursor]);

  // Clear results when search criteria changes
  useEffect(() => {
    setAllResults([]);
    setCurrentCursor(null);
  }, [
    debouncedParams.postcode,
    debouncedParams.rating,
    debouncedParams.fuel,
    debouncedParams.propertyType,
    debouncedParams.localAuthority,
    debouncedParams.constituency,
    debouncedParams.floorArea,
    debouncedParams.uprn,
  ]);

  const handleLoadMore = () => {
    if (currentCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      loadMoreQuery.refetch();
    }
  };

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
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded p-4 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearchCriteria && error && (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {hasSearchCriteria && allResults.length === 0 && !isLoading && (
        <EmptyState
          type="no-results"
          searchQuery={getCurrentSearchQuery()}
        />
      )}

      {allResults.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {allResults.length} results
              {currentCursor && ' (more available)'}
            </p>
          </div>

          <div className="grid gap-4">
            {allResults.map((property: any) => (
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

          {/* Load More Button */}
          {currentCursor && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Loading more...
                  </div>
                ) : (
                  'Load More Results'
                )}
              </Button>
            </div>
          )}

          {!currentCursor && allResults.length > 0 && (
            <div className="mt-6 text-center text-gray-500 text-sm">
              No more results available
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}