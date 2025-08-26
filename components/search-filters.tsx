'use client';

import {
  ENERGY_RATINGS,
  ENERGY_RATING_LABELS,
  ENERGY_RATING_COLORS,
  type PropertyType,
} from '@/lib/constants';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface SearchFiltersProps {
  searchParams: {
    postcode?: string;
    rating?: string;
    fuel?: string;
    propertyType?: string[];
    floorArea?: string;
    uprn?: string;
    localAuthority?: string;
    constituency?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onParamsChange: (params: Partial<SearchFiltersProps['searchParams']>) => void;
}

export function SearchFilters({ searchParams, onParamsChange }: SearchFiltersProps) {
  // Fetch filter options from API
  const { data: filterOptions, isLoading: isLoadingFilters } = trpc.filters.getOptions.useQuery();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2007 }, (_, i) => 2008 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePropertyTypeChange = (type: PropertyType, checked: boolean) => {
    const current = searchParams.propertyType || [];
    const updated = checked
      ? [...current, type]
      : current.filter(t => t !== type);
    onParamsChange({ propertyType: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="bg-sidebar p-6 space-y-6 border-r border-sidebar-border">
      {/* Postcode */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Postcode
        </label>
        <Input
          type="text"
          value={searchParams.postcode || ''}
          onChange={(e) => onParamsChange({ postcode: e.target.value.trim() || undefined })}
          placeholder="Postcode"
          className="w-full"
        />
      </div>

      {/* Local Government */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">LOCAL GOVERNMENT</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-sidebar-foreground/70 mb-1">Local Authority</label>
            <Select 
              value={searchParams.localAuthority || 'any'}
              onValueChange={(value) => onParamsChange({ localAuthority: value === 'any' ? undefined : value })}
              disabled={isLoadingFilters}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder={isLoadingFilters ? "Loading..." : "[Any]"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">[Any]</SelectItem>
                {filterOptions?.localAuthorities.map((authority) => (
                  <SelectItem key={authority.code} value={authority.code}>
                    {authority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-sidebar-foreground/70 mb-1">Constituency</label>
            <Select 
              value={searchParams.constituency || 'any'}
              onValueChange={(value) => onParamsChange({ constituency: value === 'any' ? undefined : value })}
              disabled={isLoadingFilters}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder={isLoadingFilters ? "Loading..." : "[Any]"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">[Any]</SelectItem>
                {filterOptions?.constituencies.map((constituency) => (
                  <SelectItem key={constituency.code} value={constituency.code}>
                    {constituency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* UPRN */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-2">UPRN</h3>
        <Input
          type="text"
          value={searchParams.uprn || ''}
          onChange={(e) => onParamsChange({ uprn: e.target.value.trim() || undefined })}
          placeholder="Unique Property Reference Number"
          className="w-full text-sm"
        />
      </div>

      {/* Property Type */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">PROPERTY TYPE</h3>
        <div className="space-y-2">
          {isLoadingFilters ? (
            <div className="text-sm text-sidebar-foreground/70">Loading...</div>
          ) : (
            filterOptions?.propertyTypes.map((type) => (
              <label key={type} className="flex items-center text-sm text-sidebar-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchParams.propertyType?.includes(type) || false}
                  onChange={(e) => handlePropertyTypeChange(type as PropertyType, e.target.checked)}
                  className="mr-2 rounded accent-sidebar-primary"
                />
                {type}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Property Total Floor Area */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">PROPERTY TOTAL FLOOR AREA</h3>
        <div className="space-y-2">
          {isLoadingFilters ? (
            <div className="text-sm text-sidebar-foreground/70">Loading...</div>
          ) : (
            filterOptions?.floorAreaRanges.map((range) => (
              <label key={range} className="flex items-center text-sm text-sidebar-foreground cursor-pointer">
                <input
                  type="radio"
                  name="floorArea"
                  value={range}
                  checked={searchParams.floorArea === range}
                  onChange={(e) => onParamsChange({ floorArea: e.target.checked ? range : undefined })}
                  className="mr-2 accent-sidebar-primary"
                />
                {range}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Current Energy Rating */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">CURRENT ENERGY RATING</h3>
        <div className="space-y-1">
          {ENERGY_RATINGS.map((rating) => (
            <label key={rating} className="flex items-center text-sm cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={searchParams.rating === rating}
                onChange={(e) => onParamsChange({ rating: e.target.checked ? rating : undefined })}
                className="mr-2 accent-sidebar-primary"
              />
              <div className="flex items-center flex-1">
                <div className={`w-4 h-4 rounded-sm mr-2 ${ENERGY_RATING_COLORS[rating]}`}></div>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sidebar-primary-foreground bg-sidebar-foreground px-1 rounded text-xs">
                    {rating}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70 ml-2">
                    {ENERGY_RATING_LABELS[rating]}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Certificate Lodgement Date */}
      <div className="bg-sidebar-accent p-3 rounded-md">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">CERTIFICATE LODGEMENT DATE</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-sidebar-foreground/70 mb-1">From</label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={searchParams.dateFrom?.split('-')[1] || ''}
                onValueChange={(month) => {
                  const year = searchParams.dateFrom?.split('-')[0] || '2008';
                  onParamsChange({ dateFrom: month ? `${year}-${month}` : undefined });
                }}
              >
                <SelectTrigger className="text-sm" size="sm">
                  <SelectValue placeholder="January" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={searchParams.dateFrom?.split('-')[0] || '2008'}
                onValueChange={(year) => {
                  const month = searchParams.dateFrom?.split('-')[1] || '01';
                  onParamsChange({ dateFrom: `${year}-${month}` });
                }}
              >
                <SelectTrigger className="text-sm" size="sm">
                  <SelectValue placeholder="2008" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-sidebar-foreground/70 mb-1">To</label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={searchParams.dateTo?.split('-')[1] || ''}
                onValueChange={(month) => {
                  const year = searchParams.dateTo?.split('-')[0] || String(currentYear);
                  onParamsChange({ dateTo: month ? `${year}-${month}` : undefined });
                }}
              >
                <SelectTrigger className="text-sm" size="sm">
                  <SelectValue placeholder="December" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={searchParams.dateTo?.split('-')[0] || String(currentYear)}
                onValueChange={(year) => {
                  const month = searchParams.dateTo?.split('-')[1] || '12';
                  onParamsChange({ dateTo: `${year}-${month}` });
                }}
              >
                <SelectTrigger className="text-sm" size="sm">
                  <SelectValue placeholder={String(currentYear)} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <Button
        className="w-full"
        onClick={() => {/* Search will happen automatically via debounced params */ }}
      >
        Search
      </Button>
    </div>
  );
}