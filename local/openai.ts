/**
 * OpenAI DALL-E image generation for local development.
 * Uses the OpenAI SDK directly — no SQS queue, no Lambda worker.
 * Generation is synchronous (awaited inline) since there's no queue.
 */
import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in .env.local');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

// ── Hindu keywords (mirrors backend/lambda/src/utils/content-rules.ts) ───────
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

// ── Greek keywords ────────────────────────────────────────────────────────────
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

const BLOCKED_PATTERNS = [
  /\b(nsfw|nude|naked|explicit|porn|sexual|gore|violent|blood|kill|murder|death)\b/i,
  /\b(weapon|gun|knife|sword\s+attack|assault)\b/i,
  /\b(racist|hate|slur|offensive|discriminat)\b/i,
  /\b(real\s+person|celebrity|politician|public\s+figure)\b/i,
  /\b(child|minor|underage)\b/i,
  /\b(drug|cocaine|heroin|meth)\b/i,
];

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  detectedMythology?: 'hindu' | 'greek';
  enhancedPrompt?: string;
}

export function validateAndEnhancePrompt(
  prompt: string,
  artStyle: 'modern' | 'anime'
): ValidationResult {
  const lower = prompt.toLowerCase().trim();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) {
      return { valid: false, reason: 'Content policy violation. Please keep your prompt appropriate.' };
    }
  }

  let detectedMythology: 'hindu' | 'greek' | undefined;
  if (HINDU_KEYWORDS.some(k => lower.includes(k))) detectedMythology = 'hindu';
  else if (GREEK_KEYWORDS.some(k => lower.includes(k))) detectedMythology = 'greek';

  if (!detectedMythology) {
    return {
      valid: false,
      reason: 'Design must relate to Hindu or Greek mythology. Include terms like "Shiva", "Zeus", "Ganesha", "Athena", etc.',
    };
  }

  const stylePrefix = artStyle === 'anime'
    ? 'Create an anime-styled illustration of'
    : 'Create a modern artistic depiction of';
  const styleSuffix = artStyle === 'anime'
    ? 'in vibrant anime art style with bold lines and dynamic composition, suitable for t-shirt printing on a solid background'
    : 'in contemporary modern art style with clean design and rich colors, suitable for t-shirt printing on a solid background';

  return {
    valid: true,
    detectedMythology,
    enhancedPrompt: `${stylePrefix} ${prompt}. ${styleSuffix}`,
  };
}

export async function generateDesignImage(enhancedPrompt: string): Promise<string> {
  const openai = getClient();

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'url',
  });

  const url = response.data?.[0]?.url;
  if (!url) throw new Error('No image URL returned from OpenAI');
  return url;
}
