'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CartItem {
  itemId: string;
  productId: string | null;
  sessionId: string | null;
  type: 'pre-designed' | 'custom';
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  printPlacement: string | null;
  designImageUrl: string | null;
  imageUrl: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
  const authHeader = { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idToken') : ''}` };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${apiEndpoint}/cart`, { headers: authHeader });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setItems(data.items || []);
      setSubtotal(data.subtotal || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(`${apiEndpoint}/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to update quantity');
        return;
      }
      if (quantity === 0) {
        setItems(prev => prev.filter(i => i.itemId !== itemId));
        toast.success('Item removed');
      } else {
        setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity } : i));
      }
      recalcSubtotal();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`${apiEndpoint}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) throw new Error('Failed to remove');
      setItems(prev => prev.filter(i => i.itemId !== itemId));
      toast.success('Item removed from cart');
      recalcSubtotal();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const recalcSubtotal = () => {
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    setSubtotal(Math.round(total * 100) / 100);
  };

  useEffect(() => {
    recalcSubtotal();
  }, [items]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/products')}>Browse Products</Button>
            <Button variant="outline" onClick={() => router.push('/design')}>Create Custom Design</Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.itemId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {(item.imageUrl || item.designImageUrl) ? (
                        <img
                          src={item.designImageUrl || item.imageUrl || ''}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.size} / {item.color}
                            {item.printPlacement && ` / ${item.printPlacement}`}
                          </p>
                          <Badge variant={item.type === 'custom' ? 'default' : 'secondary'} className="mt-1 text-xs">
                            {item.type === 'custom' ? 'Custom Design' : 'Pre-designed'}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex items-center gap-3 mt-3">
                        {item.type === 'pre-designed' ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.itemId, Math.max(0, item.quantity - 1))}
                            >
                              −
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 0) updateQuantity(item.itemId, val);
                              }}
                              className="w-16 text-center"
                              min={0}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Qty: 1</span>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 ml-auto"
                          onClick={() => removeItem(item.itemId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6"
                  onClick={() => router.push('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => router.push('/products')}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
