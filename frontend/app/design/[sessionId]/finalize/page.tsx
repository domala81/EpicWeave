'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STANDARD_COLORS = [
  'Black', 'White', 'Navy', 'Royal Blue', 'Sky Blue', 'Teal',
  'Forest Green', 'Kelly Green', 'Lime', 'Yellow', 'Gold', 'Orange',
  'Red', 'Maroon', 'Pink', 'Hot Pink', 'Purple', 'Lavender',
  'Gray', 'Charcoal', 'Silver', 'Tan', 'Brown', 'Olive',
  'Mint', 'Coral', 'Peach', 'Burgundy', 'Slate', 'Cream',
];

const COLOR_HEX: Record<string, string> = {
  'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#000080',
  'Royal Blue': '#4169E1', 'Sky Blue': '#87CEEB', 'Teal': '#008080',
  'Forest Green': '#228B22', 'Kelly Green': '#4CBB17', 'Lime': '#00FF00',
  'Yellow': '#FFFF00', 'Gold': '#FFD700', 'Orange': '#FFA500',
  'Red': '#FF0000', 'Maroon': '#800000', 'Pink': '#FFC0CB',
  'Hot Pink': '#FF69B4', 'Purple': '#800080', 'Lavender': '#E6E6FA',
  'Gray': '#808080', 'Charcoal': '#36454F', 'Silver': '#C0C0C0',
  'Tan': '#D2B48C', 'Brown': '#A52A2A', 'Olive': '#808000',
  'Mint': '#98FF98', 'Coral': '#FF7F50', 'Peach': '#FFDAB9',
  'Burgundy': '#800020', 'Slate': '#708090', 'Cream': '#FFFDD0',
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PLACEMENTS = [
  { value: 'front', label: 'Front Only' },
  { value: 'back', label: 'Back Only' },
  { value: 'both', label: 'Front & Back (+$8.00)' },
];

interface PriceBreakdown {
  basePrice: number;
  sizeMultiplier: number;
  sizeAdjustedPrice: number;
  printPlacement: string;
  placementSurcharge: number;
  totalPrice: number;
}

export default function FinalizeDesignPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [designImageUrl, setDesignImageUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedPlacement, setSelectedPlacement] = useState('front');
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
  const authHeader = { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idToken') : ''}` };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`${apiEndpoint}/sessions/${sessionId}/status`, { headers: authHeader });
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      setDesignImageUrl(data.latestImageUrl);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await fetch(`${apiEndpoint}/sessions/${sessionId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          color: selectedColor,
          size: selectedSize,
          printPlacement: selectedPlacement,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to finalize');
        return;
      }

      const data = await res.json();
      setPriceBreakdown(data.priceBreakdown);
      setFinalized(true);
      toast.success('Design finalized! Review pricing and add to cart.');
    } catch (error) {
      console.error('Error finalizing:', error);
      toast.error('Failed to finalize design');
    } finally {
      setFinalizing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!priceBreakdown) return;
    setAddingToCart(true);
    try {
      const res = await fetch(`${apiEndpoint}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          sessionId,
          type: 'custom',
          size: selectedSize,
          color: selectedColor,
          printPlacement: selectedPlacement,
          quantity: 1,
          designImageUrl,
          unitPrice: priceBreakdown.totalPrice,
        }),
      });

      if (!res.ok) throw new Error('Failed to add to cart');
      toast.success('Custom design added to cart!');
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading design...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => router.push(`/design/${sessionId}`)} className="mb-4">
        ← Back to Studio
      </Button>

      <h1 className="text-3xl font-bold mb-6">Finalize Your Custom T-Shirt</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* T-Shirt Mockup Preview */}
        <div>
          <Card>
            <CardContent className="p-6">
              {/* Mockup: colored background with design overlay */}
              <div
                className="relative aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: COLOR_HEX[selectedColor] || '#000000' }}
              >
                {designImageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src={designImageUrl}
                      alt="Your custom design"
                      className="max-w-[70%] max-h-[60%] object-contain drop-shadow-lg rounded"
                    />
                  </div>
                )}

                {/* T-shirt outline overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-white/10 rounded-lg" />

                {/* Placement indicator */}
                <div className="absolute bottom-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlacement === 'both' ? 'Front & Back' : selectedPlacement === 'front' ? 'Front' : 'Back'}
                  </Badge>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-3">
                {selectedColor} — Size {selectedSize}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Options & Pricing */}
        <div className="space-y-6">
          {/* Color Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">T-Shirt Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {STANDARD_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setFinalized(false); }}
                    className={`h-10 rounded-md border-2 transition-all hover:scale-110
                      ${selectedColor === color
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-300'}`}
                    style={{ backgroundColor: COLOR_HEX[color] }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Selected: <span className="font-medium">{selectedColor}</span>
              </p>
            </CardContent>
          </Card>

          {/* Size Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {SIZES.map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    onClick={() => { setSelectedSize(size); setFinalized(false); }}
                    className="flex-1"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Print Placement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Print Placement</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPlacement} onValueChange={(v) => { setSelectedPlacement(v); setFinalized(false); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          {priceBreakdown && finalized && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>${priceBreakdown.basePrice.toFixed(2)}</span>
                </div>
                {priceBreakdown.sizeMultiplier !== 1.0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Size Adjustment (×{priceBreakdown.sizeMultiplier})</span>
                    <span>${priceBreakdown.sizeAdjustedPrice.toFixed(2)}</span>
                  </div>
                )}
                {priceBreakdown.placementSurcharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Front & Back Surcharge</span>
                    <span>+${priceBreakdown.placementSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${priceBreakdown.totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!finalized ? (
              <Button size="lg" className="w-full" onClick={handleFinalize} disabled={finalizing}>
                {finalizing ? 'Calculating Price...' : 'Calculate Price'}
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={addingToCart}>
                {addingToCart ? 'Adding to Cart...' : `Add to Cart — $${priceBreakdown?.totalPrice.toFixed(2)}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
