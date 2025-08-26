'use client';

import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';

export function useSearchParams() {
  return useQueryStates(
    {
      postcode: parseAsString,
      rating: parseAsString,
      fuel: parseAsString,
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
      shallow: false,
      clearOnDefault: true,
    }
  );
}