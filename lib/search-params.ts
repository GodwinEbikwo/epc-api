'use client';

import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';

export function useSearchParams() {
  return useQueryStates(
    {
      postcode: parseAsString.withDefault(''),
      rating: parseAsString.withDefault(''),
      fuel: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
      shallow: false,
    }
  );
}