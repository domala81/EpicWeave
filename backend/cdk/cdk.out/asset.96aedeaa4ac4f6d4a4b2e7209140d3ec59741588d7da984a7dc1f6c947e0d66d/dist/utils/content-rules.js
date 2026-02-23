"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndEnhancePrompt = validateAndEnhancePrompt;
exports.hasLocalMythologyReference = hasLocalMythologyReference;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const ssm = new client_ssm_1.SSMClient({});
// Hindu mythology keywords
const HINDU_KEYWORDS = [
    'shiva', 'vishnu', 'brahma', 'krishna', 'rama', 'ganesha', 'ganesh',
    'hanuman', 'lakshmi', 'saraswati', 'parvati', 'durga', 'kali',
    'indra', 'agni', 'surya', 'vayu', 'varuna', 'yama',
    'arjuna', 'bhima', 'draupadi', 'kunti', 'karna',
    'mahabharata', 'ramayana', 'vedic', 'hindu', 'deva', 'asura',
    'garuda', 'nandi', 'chakra', 'trishul', 'trident', 'lotus',
    'kailash', 'mount meru', 'vimana', 'amrit', 'amrita',
    'avatar', 'dharma', 'karma', 'moksha', 'samsara',
    'mantra', 'yantra', 'tantra', 'puja', 'temple',
    'kurukshetra', 'ayodhya', 'vrindavan', 'mathura',
    'narasimha', 'vamana', 'parashurama', 'matsya', 'kurma', 'varaha',
];
// Greek mythology keywords
const GREEK_KEYWORDS = [
    'zeus', 'poseidon', 'hades', 'athena', 'apollo', 'artemis',
    'ares', 'aphrodite', 'hermes', 'hephaestus', 'dionysus', 'demeter',
    'hera', 'persephone', 'hestia', 'nike', 'eros', 'pan',
    'hercules', 'heracles', 'achilles', 'odysseus', 'perseus',
    'theseus', 'jason', 'orpheus', 'icarus', 'daedalus',
    'medusa', 'minotaur', 'cerberus', 'hydra', 'cyclops', 'centaur',
    'phoenix', 'pegasus', 'griffin', 'siren', 'sphinx',
    'olympus', 'mount olympus', 'parthenon', 'acropolis',
    'trojan', 'troy', 'sparta', 'athens', 'ithaca',
    'iliad', 'odyssey', 'greek', 'titan', 'olympian',
    'styx', 'elysium', 'tartarus', 'underworld',
    'thunderbolt', 'trident', 'aegis', 'golden fleece',
    'labyrinth', 'oracle', 'delphi', 'nemean', 'argonaut',
];
// Safety filter - blocked content
const BLOCKED_PATTERNS = [
    /\b(nsfw|nude|naked|explicit|porn|sexual|gore|violent|blood|kill|murder|death)\b/i,
    /\b(weapon|gun|knife|sword\s+attack|assault)\b/i,
    /\b(racist|hate|slur|offensive|discriminat)\b/i,
    /\b(real\s+person|celebrity|politician|public\s+figure)\b/i,
    /\b(child|minor|underage)\b/i,
    /\b(drug|cocaine|heroin|meth)\b/i,
];
/**
 * Validate prompt against content rules
 * 1. Must reference Hindu or Greek mythology
 * 2. Must pass safety filter
 * 3. Enhances prompt with art style enforcement
 */
async function validateAndEnhancePrompt(prompt, artStyle) {
    const lowerPrompt = prompt.toLowerCase().trim();
    // Step 1: Safety filter
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(lowerPrompt)) {
            return {
                valid: false,
                reason: 'Content policy violation. Please ensure your prompt is appropriate.',
            };
        }
    }
    // Step 2: Read allowed mythology types from Parameter Store
    let allowedTypes = ['hindu', 'greek'];
    try {
        const param = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/mythology/allowed-types' }));
        if (param.Parameter?.Value) {
            allowedTypes = param.Parameter.Value.split(',').map(t => t.trim().toLowerCase());
        }
    }
    catch (error) {
        console.warn('Could not read mythology types from Parameter Store, using defaults');
    }
    // Step 3: Check for mythology references
    let detectedMythology;
    if (allowedTypes.includes('hindu')) {
        const hasHindu = HINDU_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
        if (hasHindu)
            detectedMythology = 'hindu';
    }
    if (!detectedMythology && allowedTypes.includes('greek')) {
        const hasGreek = GREEK_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
        if (hasGreek)
            detectedMythology = 'greek';
    }
    if (!detectedMythology) {
        return {
            valid: false,
            reason: `Design must relate to ${allowedTypes.join(' or ')} mythology. Please include mythology-related terms in your prompt.`,
        };
    }
    // Step 4: Enhance prompt with art style enforcement
    const stylePrefix = artStyle === 'anime'
        ? 'Create an anime-styled illustration of'
        : 'Create a modern artistic depiction of';
    const styleSuffix = artStyle === 'anime'
        ? 'in vibrant anime art style with bold lines and dynamic composition, suitable for t-shirt printing on a solid background'
        : 'in contemporary modern art style with clean design and rich colors, suitable for t-shirt printing on a solid background';
    const enhancedPrompt = `${stylePrefix} ${prompt}. ${styleSuffix}`;
    return {
        valid: true,
        detectedMythology,
        enhancedPrompt,
    };
}
/**
 * Quick check if prompt contains any mythology reference (no SSM call)
 */
function hasLocalMythologyReference(prompt) {
    const lower = prompt.toLowerCase();
    return (HINDU_KEYWORDS.some(k => lower.includes(k)) ||
        GREEK_KEYWORDS.some(k => lower.includes(k)));
}
