'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductModal } from '@/components/product-modal';

const CATALOG = [
  {
    id: 'greek-1',
    productId: 'greek-1',
    name: 'Zeus — God of Thunder',
    description: 'Zeus wielding his iconic thunderbolts atop Mount Olympus, rendered in bold modern art.',
    mythology: 'greek',
    artStyle: 'modern',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek1.png',
    tags: ['zeus', 'thunder', 'olympus'],
  },
  {
    id: 'greek-2',
    productId: 'greek-2',
    name: 'Athena — Goddess of Wisdom',
    description: 'Athena in full battle regalia, combining wisdom and war in a vibrant anime-inspired style.',
    mythology: 'greek',
    artStyle: 'anime',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek2.png',
    tags: ['athena', 'wisdom', 'warrior'],
  },
  {
    id: 'greek-3',
    productId: 'greek-3',
    name: 'Poseidon — Lord of the Seas',
    description: "Poseidon commanding the ocean depths with his legendary trident in a dramatic modern style.",
    mythology: 'greek',
    artStyle: 'modern',
    basePrice: 29.99,
    imageUrl: '/TestImg/Greek3.png',
    tags: ['poseidon', 'ocean', 'trident'],
  },
  {
    id: 'hindu-1',
    productId: 'hindu-1',
    name: 'Shiva — The Destroyer',
    description: 'Lord Shiva in deep cosmic meditation, surrounded by flames and sacred energy.',
    mythology: 'hindu',
    artStyle: 'modern',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu1.png',
    tags: ['shiva', 'meditation', 'cosmic'],
  },
  {
    id: 'hindu-2',
    productId: 'hindu-2',
    name: 'Ganesha — Remover of Obstacles',
    description: 'Lord Ganesha bestowing blessings, beautifully illustrated in vibrant anime style.',
    mythology: 'hindu',
    artStyle: 'anime',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu2.png',
    tags: ['ganesha', 'blessings', 'prosperity'],
  },
  {
    id: 'hindu-3',
    productId: 'hindu-3',
    name: 'Durga — Goddess of Triumph',
    description: 'Goddess Durga in her triumphant form, radiating power and divine strength.',
    mythology: 'hindu',
    artStyle: 'modern',
    basePrice: 29.99,
    imageUrl: '/TestImg/Hindu3.png',
    tags: ['durga', 'power', 'triumph'],
  },
];

type FilterMythology = 'all' | 'greek' | 'hindu';
type FilterStyle = 'all' | 'modern' | 'anime';

export default function ProductsPage() {
  const [mythology, setMythology] = useState<FilterMythology>('all');
  const [artStyle, setArtStyle] = useState<FilterStyle>('all');
  const [selectedDesign, setSelectedDesign] = useState<typeof CATALOG[0] | null>(null);

  const filtered = CATALOG.filter((p) => {
    if (mythology !== 'all' && p.mythology !== mythology) return false;
    if (artStyle !== 'all' && p.artStyle !== artStyle) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white py-14 px-4">
        <div className="container mx-auto">
          <Link href="/" className="text-white/60 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Mythology Catalog</h1>
          <p className="text-purple-200 text-lg max-w-xl">
            Hand-picked Hindu &amp; Greek mythology designs. Select any design to customize your tee.
          </p>
          <div className="mt-6">
            <Link href="/design">
              <Button className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6">
                ✨ Create Your Own with AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <span className="text-sm font-semibold text-muted-foreground">Filter by:</span>

          {/* Mythology filter */}
          <div className="flex gap-2">
            {(['all', 'greek', 'hindu'] as FilterMythology[]).map((m) => (
              <button
                key={m}
                onClick={() => setMythology(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  mythology === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/60 text-foreground'
                }`}
              >
                {m === 'all' ? 'All Mythologies' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Style filter */}
          <div className="flex gap-2">
            {(['all', 'modern', 'anime'] as FilterStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setArtStyle(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  artStyle === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/60 text-foreground'
                }`}
              >
                {s === 'all' ? 'All Styles' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} designs</span>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No designs match your filters.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setMythology('all'); setArtStyle('all'); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedDesign(product)}
              >
                {/* Image */}
                <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white text-purple-900 font-semibold px-4 py-1.5 rounded-full text-sm shadow-md">
                      Select Design →
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize text-xs">{product.mythology}</Badge>
                    <Badge variant="outline" className="capitalize text-xs">{product.artStyle}</Badge>
                  </div>
                  <h3 className="font-bold text-base leading-snug mb-1">{product.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">${product.basePrice.toFixed(2)}</span>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        open={!!selectedDesign}
        onClose={() => setSelectedDesign(null)}
        design={selectedDesign ? {
          id: selectedDesign.id,
          productId: selectedDesign.productId,
          name: selectedDesign.name,
          imageUrl: selectedDesign.imageUrl,
          basePrice: selectedDesign.basePrice,
          type: 'catalog',
          mythology: selectedDesign.mythology,
          artStyle: selectedDesign.artStyle,
        } : null}
      />
    </div>
  );
}
