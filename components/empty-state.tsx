import { Search, Home, MapPin } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-search' | 'no-results';
  searchQuery?: string;
}

export function EmptyState({ type, searchQuery }: EmptyStateProps) {
  if (type === 'no-search') {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 mb-6 text-gray-300">
          <Search className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Start your property search
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Enter a postcode, select an energy rating, or choose a fuel type to find properties in the EPC database.
        </p>
        <div className="mt-6 text-sm text-gray-400">
          <p className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            Try: "SW1A 1AA", "SE1", or "M1"
          </p>
          <p className="flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Over 27 million properties available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 mb-6 text-gray-300">
        <Home className="w-full h-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No properties found
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-4">
        {searchQuery 
          ? `No properties match your search for "${searchQuery}". Try adjusting your filters or using a different postcode.`
          : "No properties match your current filters. Try adjusting your search criteria."
        }
      </p>
      <div className="text-sm text-gray-400 space-y-1">
        <p>• Try a broader postcode (e.g., "SE" instead of "SE1 6SH")</p>
        <p>• Remove energy rating or fuel type filters</p>
        <p>• Check spelling of postcode</p>
      </div>
    </div>
  );
}