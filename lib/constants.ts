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

export const PROPERTY_TYPES = ['bungalow', 'flat', 'house', 'maisonette', 'park home'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

export const FLOOR_AREA_RANGES = [
  'unknown',
  '1-55m²',
  '55-70m²', 
  '70-85m²',
  '85-110m²',
  '110m+'
] as const;
export type FloorAreaRange = typeof FLOOR_AREA_RANGES[number];

// Display labels for UI
export const ENERGY_RATING_LABELS: Record<EnergyRating, string> = {
  'A': '(92+)',
  'B': '(81-91)', 
  'C': '(69-80)',
  'D': '(55-68)',
  'E': '(39-54)',
  'F': '(21-38)',
  'G': '(1-20)'
};

export const ENERGY_RATING_COLORS: Record<EnergyRating, string> = {
  A: 'bg-green-600',
  B: 'bg-green-500', 
  C: 'bg-yellow-400',
  D: 'bg-yellow-500',
  E: 'bg-orange-500',
  F: 'bg-red-500',
  G: 'bg-red-600',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  'mains gas (not community)': 'Mains Gas',
  'electricity': 'Electricity',
  'oil': 'Oil',
  'LPG': 'LPG',
  'solid fuel': 'Solid Fuel'
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  bungalow: 'Bungalow',
  flat: 'Flat',
  house: 'House',
  maisonette: 'Maisonette',
  'park home': 'Park Home',
};

// Search defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_EXPORT_LIMIT = 100;
export const MAX_EXPORT_LIMIT = 10000;