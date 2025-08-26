'use client';

import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedSearch(
  searchParams: Record<string, any>,
  delay: number = 300
) {
  const [immediateParams, setImmediateParams] = useState(searchParams);
  const debouncedParams = useDebounced(immediateParams, delay);

  const setSearchParams = (newParams: Partial<typeof searchParams>) => {
    setImmediateParams(prev => ({ ...prev, ...newParams }));
  };

  return {
    searchParams: immediateParams,
    debouncedParams,
    setSearchParams,
  };
}