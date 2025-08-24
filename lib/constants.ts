// Energy Performance Certificate Constants

export const ENERGY_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export type EnergyRating = typeof ENERGY_RATINGS[number];

export const FUEL_TYPES = [
  'mains gas (not community)',
  'electricity', 
  'oil',
  'LPG',
  'solid fuel'
] as const;
export type FuelType = typeof FUEL_TYPES[number];

// Display labels for UI
export const ENERGY_RATING_LABELS: Record<EnergyRating, string> = {
  'A': 'A (Most Efficient)',
  'B': 'B (Very Efficient)', 
  'C': 'C (Efficient)',
  'D': 'D (Fairly Efficient)',
  'E': 'E (Poor)',
  'F': 'F (Very Poor)',
  'G': 'G (Least Efficient)'
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  'mains gas (not community)': 'Mains Gas',
  'electricity': 'Electricity',
  'oil': 'Oil',
  'LPG': 'LPG',
  'solid fuel': 'Solid Fuel'
};

// Search defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_EXPORT_LIMIT = 100;
export const MAX_EXPORT_LIMIT = 10000;