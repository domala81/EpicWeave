"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRINT_PLACEMENTS = exports.ART_STYLES = exports.MYTHOLOGIES = exports.SIZES = exports.STANDARD_COLORS = void 0;
exports.isValidColor = isValidColor;
exports.isValidSize = isValidSize;
exports.isValidMythology = isValidMythology;
exports.isValidArtStyle = isValidArtStyle;
/**
 * 30 Standard T-Shirt Colors for EpicWeave
 * From INTENT.md Section 5.4
 */
exports.STANDARD_COLORS = [
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
];
exports.SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
exports.MYTHOLOGIES = ['hindu', 'greek'];
exports.ART_STYLES = ['modern', 'anime'];
exports.PRINT_PLACEMENTS = ['front', 'back', 'both'];
/**
 * Validate if a color is in the standard set
 */
function isValidColor(color) {
    return exports.STANDARD_COLORS.includes(color);
}
/**
 * Validate if a size is valid
 */
function isValidSize(size) {
    return exports.SIZES.includes(size);
}
/**
 * Validate if a mythology type is valid
 */
function isValidMythology(mythology) {
    return exports.MYTHOLOGIES.includes(mythology);
}
/**
 * Validate if an art style is valid
 */
function isValidArtStyle(style) {
    return exports.ART_STYLES.includes(style);
}
