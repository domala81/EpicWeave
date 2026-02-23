'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PLACEMENTS = [
  { value: 'front', label: 'Front Only' },
  { value: 'back', label: 'Back Only' },
  { value: 'both', label: 'Front & Back', extraCost: 8 },
];

const TEE_COLORS = [
  { name: 'White', hex: '#FFFFFF', border: '#e2e8f0' },
  { name: 'Black', hex: '#1a1a2e', border: '#1a1a2e' },
  { name: 'Navy', hex: '#1e3a5f', border: '#1e3a5f' },
  { name: 'Royal Blue', hex: '#4169E1', border: '#4169E1' },
  { name: 'Forest Green', hex: '#228B22', border: '#228B22' },
  { name: 'Red', hex: '#DC2626', border: '#DC2626' },
  { name: 'Maroon', hex: '#7f1d1d', border: '#7f1d1d' },
  { name: 'Purple', hex: '#7c3aed', border: '#7c3aed' },
  { name: 'Charcoal', hex: '#374151', border: '#374151' },
  { name: 'Orange', hex: '#ea580c', border: '#ea580c' },
  { name: 'Pink', hex: '#ec4899', border: '#ec4899' },
  { name: 'Teal', hex: '#0d9488', border: '#0d9488' },
  { name: 'Yellow', hex: '#ca8a04', border: '#ca8a04' },
  { name: 'Sky Blue', hex: '#38bdf8', border: '#38bdf8' },
  { name: 'Lavender', hex: '#a78bfa', border: '#a78bfa' },
  { name: 'Olive', hex: '#65a30d', border: '#65a30d' },
];

function TShirtMockup({ teeColor, designUrl, placement }: { teeColor: string; designUrl: string; placement: string }) {
  const showFront = placement === 'front' || placement === 'both';

  return (
    <div className="relative flex items-center justify-center w-full">
      <svg viewBox="0 0 300 310" className="w-full max-w-[260px] drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
        {/* T-shirt body */}
        <path
          d="M 108,14 C 118,4 132,0 150,4 C 168,0 182,4 192,14 L 248,14 L 295,70 L 258,90 L 258,295 L 42,295 L 42,90 L 5,70 L 52,14 Z"
          fill={teeColor}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="1.5"
        />
        {/* Collar shadow */}
        <path
          d="M 108,14 C 118,4 132,0 150,4 C 168,0 182,4 192,14"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Sleeve seam left */}
        <line x1="42" y1="90" x2="90" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        {/* Sleeve seam right */}
        <line x1="210" y1="90" x2="258" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />

        {/* Design image on front chest */}
        {showFront && (
          <>
            <defs>
              <clipPath id="design-clip">
                <rect x="88" y="100" width="124" height="124" rx="6" />
              </clipPath>
            </defs>
            <image
              href={designUrl}
              x="88"
              y="100"
              width="124"
              height="124"
              preserveAspectRatio="xMidYMid meet"
              clipPath="url(#design-clip)"
            />
          </>
        )}

        {/* Back text indicator */}
        {placement === 'back' && (
          <text x="150" y="170" textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="11" fontFamily="sans-serif">
            Design on back
          </text>
        )}
        {placement === 'both' && (
          <text x="150" y="238" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="sans-serif">
            + back print
          </text>
        )}
      </svg>
    </div>
  );
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  design: {
    id: string;
    name: string;
    imageUrl: string;
    basePrice: number;
    type: 'catalog' | 'custom';
    sessionId?: string;
    productId?: string;
    mythology?: string;
    artStyle?: string;
  } | null;
}

export function ProductModal({ open, onClose, design }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(TEE_COLORS[0]);
  const [selectedPlacement, setSelectedPlacement] = useState('front');
  const [adding, setAdding] = useState(false);

  if (!design) return null;

  const placementExtra = selectedPlacement === 'both' ? 8 : 0;
  const totalPrice = design.basePrice + placementExtra;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
      const token = typeof window !== 'undefined' ? localStorage.getItem('idToken') : '';

      const body = design.type === 'catalog'
        ? {
            productId: design.productId || design.id,
            size: selectedSize,
            color: selectedColor.name,
            quantity: 1,
            printPlacement: selectedPlacement,
          }
        : {
            sessionId: design.sessionId,
            designImageUrl: design.imageUrl,
            size: selectedSize,
            color: selectedColor.name,
            printPlacement: selectedPlacement,
            name: design.name,
            unitPrice: totalPrice,
          };

      const endpoint = design.type === 'catalog' ? '/cart/items' : '/cart/custom-items';
      const res = await fetch(`${apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Added to cart!', {
          description: `${design.name} — ${selectedSize} / ${selectedColor.name}`,
          action: { label: 'View Cart', onClick: () => window.location.href = '/cart' },
        });
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to add to cart');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden gap-0">
        <div className="grid md:grid-cols-2 min-h-[520px]">
          {/* Left — T-shirt preview */}
          <div className="bg-gradient-to-br from-secondary/60 to-secondary flex flex-col items-center justify-center p-8 gap-4">
            <TShirtMockup
              teeColor={selectedColor.hex}
              designUrl={design.imageUrl}
              placement={selectedPlacement}
            />
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              {design.mythology && (
                <Badge variant="secondary" className="capitalize text-xs">{design.mythology}</Badge>
              )}
              {design.artStyle && (
                <Badge variant="outline" className="capitalize text-xs">{design.artStyle}</Badge>
              )}
              {design.type === 'custom' && (
                <Badge className="text-xs bg-accent text-accent-foreground">AI Generated</Badge>
              )}
            </div>
          </div>

          {/* Right — Options */}
          <div className="flex flex-col p-6 gap-5 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold leading-tight">{design.name}</DialogTitle>
              <p className="text-2xl font-bold text-primary mt-1">${totalPrice.toFixed(2)}</p>
            </DialogHeader>

            {/* T-shirt Color */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Tee Color — <span className="font-normal text-muted-foreground">{selectedColor.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TEE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    onClick={() => setSelectedColor(c)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.hex,
                      border: selectedColor.name === c.name
                        ? '3px solid hsl(263 70% 50%)'
                        : `2px solid ${c.border}`,
                      boxShadow: selectedColor.name === c.name ? '0 0 0 2px white, 0 0 0 4px hsl(263 70% 50%)' : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-sm font-semibold mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                      selectedSize === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Placement */}
            <div>
              <p className="text-sm font-semibold mb-2">Print Placement</p>
              <div className="flex flex-col gap-2">
                {PLACEMENTS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPlacement(p.value)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedPlacement === p.value
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border hover:border-primary/40'
                    }`}
                  >
                    <span>{p.label}</span>
                    {p.extraCost ? (
                      <span className="text-xs text-muted-foreground">+${p.extraCost}.00</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Included</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-secondary/40 rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base price</span>
                <span>${design.basePrice.toFixed(2)}</span>
              </div>
              {placementExtra > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front & Back print</span>
                  <span>+$8.00</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mt-auto"
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding...' : `Add to Cart — $${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
