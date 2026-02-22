'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface CartItem {
  itemId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  type: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Shipping form
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

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
      if (!data.items || data.items.length === 0) {
        toast.error('Cart is empty');
        router.push('/cart');
        return;
      }
      setCartItems(data.items);
      setSubtotal(data.subtotal);
      calculateTotals(data.items, data.subtotal);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: CartItem[], sub: number) => {
    const itemCount = items.reduce((s: number, i: CartItem) => s + i.quantity, 0);
    const shipping = Math.round((5.99 + Math.max(0, itemCount - 1) * 2) * 100) / 100;
    const t = 0; // No tax for now
    const tot = Math.round((sub + shipping + t) * 100) / 100;
    setShippingCost(shipping);
    setTax(t);
    setTotal(tot);
  };

  const isFormValid = () => {
    return (
      street.trim().length > 0 &&
      city.trim().length > 0 &&
      state.length === 2 &&
      /^\d{5}(-\d{4})?$/.test(zipCode)
    );
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all shipping fields correctly');
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch(`${apiEndpoint}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          shippingAddress: {
            street: street.trim(),
            city: city.trim(),
            state,
            zipCode: zipCode.trim(),
            country: 'US',
          },
          paymentMethodId: 'pm_test_placeholder', // TODO: Integrate Stripe Elements
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to place order');
        return;
      }

      const data = await res.json();
      router.push(`/orders/${data.orderId}/confirmation`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => router.push('/cart')} className="mb-4">
        ← Back to Cart
      </Button>

      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <p className="text-sm text-muted-foreground">US domestic shipping only</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main St"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="w-1/2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment (placeholder for Stripe Elements) */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-md text-center text-sm text-muted-foreground">
                <p className="font-medium mb-1">Stripe Elements Integration</p>
                <p>Card number, expiry, and CVC fields will be rendered here by Stripe.js</p>
                <p className="mt-2 text-xs">For testing, orders will use a test payment method.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.size}/{item.color} × {item.quantity}
                      </p>
                    </div>
                    <span className="ml-2">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (flat rate + $2/extra item)</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order */}
              <Button
                size="lg"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={placing || !isFormValid()}
              >
                {placing ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Session fees are non-refundable. Order payments are refundable per our return policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
