/**
 * Seed script to populate initial products
 * Run with: ts-node src/scripts/seed-products.ts
 */
import { batchPutItems } from '../utils/dynamodb';

const SEED_PRODUCTS = [
  {
    productId: 'PROD001',
    name: 'Shiva Meditation Tee',
    description: 'Lord Shiva in deep meditation on Mount Kailash, rendered in modern artistic style with cosmic elements.',
    mythology: 'hindu',
    artStyle: 'modern',
    basePrice: 25.00,
    imageUrl: 'https://cdn.epicweave.com/products/shiva-meditation.jpg',
    category: 'tshirts',
    tags: ['shiva', 'meditation', 'cosmic', 'popular'],
  },
  {
    productId: 'PROD002',
    name: 'Zeus Lightning Strike',
    description: 'Zeus wielding his thunderbolt in anime-inspired dynamic action pose.',
    mythology: 'greek',
    artStyle: 'anime',
    basePrice: 28.00,
    imageUrl: 'https://cdn.epicweave.com/products/zeus-lightning.jpg',
    category: 'tshirts',
    tags: ['zeus', 'lightning', 'olympus', 'action'],
  },
  {
    productId: 'PROD003',
    name: 'Ganesha Wisdom',
    description: 'Lord Ganesha in serene pose with modern geometric patterns and vibrant colors.',
    mythology: 'hindu',
    artStyle: 'modern',
    basePrice: 26.00,
    imageUrl: 'https://cdn.epicweave.com/products/ganesha-wisdom.jpg',
    category: 'tshirts',
    tags: ['ganesha', 'wisdom', 'geometric', 'colorful'],
  },
  {
    productId: 'PROD004',
    name: 'Athena Battle Ready',
    description: 'Athena in full battle armor with shield and spear, anime-style warrior goddess.',
    mythology: 'greek',
    artStyle: 'anime',
    basePrice: 27.00,
    imageUrl: 'https://cdn.epicweave.com/products/athena-battle.jpg',
    category: 'tshirts',
    tags: ['athena', 'warrior', 'armor', 'goddess'],
  },
  {
    productId: 'PROD005',
    name: 'Krishna Flute',
    description: 'Lord Krishna playing his flute with peacock feathers, modern artistic interpretation.',
    mythology: 'hindu',
    artStyle: 'modern',
    basePrice: 25.00,
    imageUrl: 'https://cdn.epicweave.com/products/krishna-flute.jpg',
    category: 'tshirts',
    tags: ['krishna', 'flute', 'peacock', 'music'],
  },
  {
    productId: 'PROD006',
    name: 'Apollo Sun God',
    description: 'Apollo with his lyre and sun rays, vibrant anime-style depiction.',
    mythology: 'greek',
    artStyle: 'anime',
    basePrice: 26.00,
    imageUrl: 'https://cdn.epicweave.com/products/apollo-sun.jpg',
    category: 'tshirts',
    tags: ['apollo', 'sun', 'music', 'lyre'],
  },
];

// Standard variants for each product (5 sizes × 5 popular colors = 25 variants each)
const POPULAR_COLORS = ['Black', 'White', 'Navy', 'Gray', 'Royal Blue'];
const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  const now = new Date().toISOString();
  const allItems: any[] = [];

  for (const product of SEED_PRODUCTS) {
    // Create metadata item
    const metadata = {
      PK: `PRODUCT#${product.productId}`,
      SK: 'METADATA',
      productId: product.productId,
      name: product.name,
      description: product.description,
      mythology: product.mythology,
      artStyle: product.artStyle,
      basePrice: product.basePrice,
      imageUrl: product.imageUrl,
      category: product.category,
      tags: product.tags,
      createdAt: now,
      updatedAt: now,
      GSI1PK: `MYTHOLOGY#${product.mythology}`,
      GSI1SK: `PRODUCT#${product.productId}`,
      GSI2PK: `CATEGORY#${product.category}`,
      GSI2SK: `PRICE#${String(product.basePrice).padStart(10, '0')}#${product.productId}`,
    };
    allItems.push(metadata);

    // Create variants
    for (const size of ALL_SIZES) {
      for (const color of POPULAR_COLORS) {
        const variant = {
          PK: `PRODUCT#${product.productId}`,
          SK: `VARIANT#${size}#${color}`,
          productId: product.productId,
          size,
          color,
          stockCount: Math.floor(Math.random() * 50) + 10, // Random stock 10-60
          sku: `${product.productId}-${size}-${color}`,
          createdAt: now,
          updatedAt: now,
        };
        allItems.push(variant);
      }
    }

    console.log(`✅ Prepared ${product.name} with ${ALL_SIZES.length * POPULAR_COLORS.length} variants`);
  }

  // Batch write all items
  await batchPutItems(allItems);
  
  console.log(`\n🎉 Successfully seeded ${SEED_PRODUCTS.length} products with ${allItems.length} total items!`);
  console.log('\nProducts:');
  SEED_PRODUCTS.forEach(p => {
    console.log(`  - ${p.productId}: ${p.name} (${p.mythology}/${p.artStyle}) - $${p.basePrice}`);
  });
}

// Run if executed directly
if (require.main === module) {
  seedProducts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedProducts };
