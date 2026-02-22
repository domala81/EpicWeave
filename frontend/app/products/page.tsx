'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const MYTHOLOGIES = ['all', 'hindu', 'greek'];
const ART_STYLES = ['all', 'modern', 'anime'];

interface Product {
  productId: string;
  name: string;
  description: string;
  mythology: string;
  artStyle: string;
  basePrice: number;
  imageUrl: string;
  category: string;
  tags: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mythology, setMythology] = useState('all');
  const [artStyle, setArtStyle] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [mythology, artStyle]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mythology !== 'all') params.append('mythology', mythology);
      if (artStyle !== 'all') params.append('style', artStyle);

      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
      const response = await fetch(`${apiEndpoint}/products?${params.toString()}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setMythology('all');
    setArtStyle('all');
  };

  const activeFiltersCount = (mythology !== 'all' ? 1 : 0) + (artStyle !== 'all' ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mythology T-Shirts</h1>
        <p className="text-muted-foreground">
          Explore our collection of Hindu and Greek mythology-inspired designs
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Mythology</label>
          <Select value={mythology} onValueChange={setMythology}>
            <SelectTrigger>
              <SelectValue placeholder="Select mythology" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mythologies</SelectItem>
              <SelectItem value="hindu">Hindu</SelectItem>
              <SelectItem value="greek">Greek</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Art Style</label>
          <Select value={artStyle} onValueChange={setArtStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Select art style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters ({activeFiltersCount})
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your filters.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.productId} className="flex flex-col">
              <CardHeader>
                <div className="aspect-square bg-muted rounded-md mb-4 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {product.mythology}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {product.artStyle}
                  </Badge>
                </div>
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <span className="text-2xl font-bold">${product.basePrice.toFixed(2)}</span>
                <Link href={`/products/${product.productId}`}>
                  <Button>View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && products.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
