/**
 * 30 Standard T-Shirt Colors for EpicWeave
 * From INTENT.md Section 5.4
 */
export const STANDARD_COLORS = [
  'Black',
  'White',
  'Navy',
  'Royal Blue',
  'Sky Blue',
  'Teal',
  'Forest Green',
  'Kelly Green',
  'Lime',
  'Yellow',
  'Gold',
  'Orange',
  'Red',
  'Maroon',
  'Pink',
  'Hot Pink',
  'Purple',
  'Lavender',
  'Gray',
  'Charcoal',
  'Silver',
  'Tan',
  'Brown',
  'Olive',
  'Mint',
  'Coral',
  'Peach',
  'Burgundy',
  'Slate',
  'Cream',
] as const;

export type TShirtColor = typeof STANDARD_COLORS[number];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export type TShirtSize = typeof SIZES[number];

export const MYTHOLOGIES = ['hindu', 'greek'] as const;
export type Mythology = typeof MYTHOLOGIES[number];

export const ART_STYLES = ['modern', 'anime'] as const;
export type ArtStyle = typeof ART_STYLES[number];

export const PRINT_PLACEMENTS = ['front', 'back', 'both'] as const;
export type PrintPlacement = typeof PRINT_PLACEMENTS[number];

/**
 * Validate if a color is in the standard set
 */
export function isValidColor(color: string): color is TShirtColor {
  return STANDARD_COLORS.includes(color as TShirtColor);
}

/**
 * Validate if a size is valid
 */
export function isValidSize(size: string): size is TShirtSize {
  return SIZES.includes(size as TShirtSize);
}

/**
 * Validate if a mythology type is valid
 */
export function isValidMythology(mythology: string): mythology is Mythology {
  return MYTHOLOGIES.includes(mythology as Mythology);
}

/**
 * Validate if an art style is valid
 */
export function isValidArtStyle(style: string): style is ArtStyle {
  return ART_STYLES.includes(style as ArtStyle);
}
