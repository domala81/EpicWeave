'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STANDARD_COLORS = [
  'Black', 'White', 'Navy', 'Royal Blue', 'Sky Blue', 'Teal',
  'Forest Green', 'Kelly Green', 'Lime', 'Yellow', 'Gold', 'Orange',
  'Red', 'Maroon', 'Pink', 'Hot Pink', 'Purple', 'Lavender',
  'Gray', 'Charcoal', 'Silver', 'Tan', 'Brown', 'Olive',
  'Mint', 'Coral', 'Peach', 'Burgundy', 'Slate', 'Cream',
];

const COLOR_HEX_MAP: Record<string, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Navy': '#000080',
  'Royal Blue': '#4169E1',
  'Sky Blue': '#87CEEB',
  'Teal': '#008080',
  'Forest Green': '#228B22',
  'Kelly Green': '#4CBB17',
  'Lime': '#00FF00',
  'Yellow': '#FFFF00',
  'Gold': '#FFD700',
  'Orange': '#FFA500',
  'Red': '#FF0000',
  'Maroon': '#800000',
  'Pink': '#FFC0CB',
  'Hot Pink': '#FF69B4',
  'Purple': '#800080',
  'Lavender': '#E6E6FA',
  'Gray': '#808080',
  'Charcoal': '#36454F',
  'Silver': '#C0C0C0',
  'Tan': '#D2B48C',
  'Brown': '#A52A2A',
  'Olive': '#808000',
  'Mint': '#98FF98',
  'Coral': '#FF7F50',
  'Peach': '#FFDAB9',
  'Burgundy': '#800020',
  'Slate': '#708090',
  'Cream': '#FFFDD0',
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

interface Variant {
  size: string;
  color: string;
  stockCount: number;
  sku: string;
}

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
  variants: Variant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
      const response = await fetch(`${apiEndpoint}/products/${productId}`);
      const data = await response.json();
      setProduct(data.product);
      
      // Set default selections if available
      if (data.product.variants.length > 0) {
        const firstVariant = data.product.variants[0];
        setSelectedSize(firstVariant.size);
        setSelectedColor(firstVariant.color);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableColors = () => {
    if (!product || !selectedSize) return [];
    return product.variants
      .filter(v => v.size === selectedSize && v.stockCount > 0)
      .map(v => v.color);
  };

  const getAvailableSizes = () => {
    if (!product || !selectedColor) return [];
    return product.variants
      .filter(v => v.color === selectedColor && v.stockCount > 0)
      .map(v => v.size);
  };

  const getCurrentStock = () => {
    if (!product || !selectedSize || !selectedColor) return 0;
    const variant = product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );
    return variant?.stockCount || 0;
  };

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    const stock = getCurrentStock();
    if (stock === 0) {
      toast.error('This variant is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
      const response = await fetch(`${apiEndpoint}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idToken')}`, // TODO: Use proper auth
        },
        body: JSON.stringify({
          productId: product?.productId,
          size: selectedSize,
          color: selectedColor,
          quantity: 1,
        }),
      });

      if (response.ok) {
        toast.success('Added to cart!');
      } else {
        toast.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Product not found</p>
        <div className="text-center mt-4">
          <Button onClick={() => router.push('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const stock = getCurrentStock();
  const isInStock = stock > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push('/products')} className="mb-4">
        ← Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image Available
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary" className="capitalize">{product.mythology}</Badge>
            <Badge variant="outline" className="capitalize">{product.artStyle}</Badge>
          </div>

          <p className="text-3xl font-bold mb-4">${product.basePrice.toFixed(2)}</p>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          {/* Size Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Size</label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selector - 30 Colors */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">
              Color ({STANDARD_COLORS.length} options)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {STANDARD_COLORS.map(color => {
                const available = getAvailableColors().includes(color);
                const isSelected = selectedColor === color;
                
                return (
                  <button
                    key={color}
                    onClick={() => available && setSelectedColor(color)}
                    disabled={!available}
                    className={`
                      relative h-12 rounded-md border-2 transition-all
                      ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300'}
                      ${available ? 'cursor-pointer hover:scale-110' : 'opacity-30 cursor-not-allowed'}
                    `}
                    style={{ backgroundColor: COLOR_HEX_MAP[color] }}
                    title={color}
                  >
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-500">×</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedColor && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: <span className="font-medium">{selectedColor}</span>
              </p>
            )}
          </div>

          {/* Stock Status */}
          {selectedSize && selectedColor && (
            <div className="mb-6">
              {isInStock ? (
                <p className="text-sm text-green-600">
                  ✓ In stock ({stock} available)
                </p>
              ) : (
                <p className="text-sm text-red-600">
                  ✗ Out of stock
                </p>
              )}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={!isInStock || !selectedSize || !selectedColor || addingToCart}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
