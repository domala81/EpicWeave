'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * Design Session Entry - Pay session fee and select art style
 */
export default function DesignEntryPage() {
  const router = useRouter();
  const [artStyle, setArtStyle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionFee, setSessionFee] = useState('2.00');

  const handleStartSession = async () => {
    if (!artStyle) {
      toast.error('Please select an art style');
      return;
    }

    setLoading(true);
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
      const response = await fetch(`${apiEndpoint}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
        },
        body: JSON.stringify({
          artStyleChoice: artStyle,
          paymentMethodId: 'pm_test_placeholder', // TODO: Integrate Stripe Elements
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to create session');
        return;
      }

      const data = await response.json();
      router.push(`/design/${data.sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Create Custom Design</h1>
      <p className="text-muted-foreground mb-8">
        Use AI to generate a unique mythology-themed t-shirt design
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Start AI Design Session</CardTitle>
          <CardDescription>
            A one-time session fee of ${sessionFee} will be charged to access the AI design tool.
            You&apos;ll get up to 5 design iterations within a 1-hour session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Art Style Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Choose Art Style</label>
            <Select value={artStyle} onValueChange={setArtStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select art style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">
                  Modern — Clean, contemporary artistic interpretation
                </SelectItem>
                <SelectItem value="anime">
                  Anime — Vibrant anime-styled illustration
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Session Fee</span>
              <span className="font-semibold">${sessionFee} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Max Iterations</span>
              <span>5 designs</span>
            </div>
            <div className="flex justify-between">
              <span>Session Duration</span>
              <span>1 hour</span>
            </div>
            <div className="flex justify-between">
              <span>Mythology Themes</span>
              <span>Hindu &amp; Greek</span>
            </div>
            <hr className="my-2" />
            <p className="text-muted-foreground text-xs">
              Session fee is <strong>non-refundable</strong>. Images are generated using OpenAI DALL-E.
            </p>
          </div>

          {/* Pay & Start Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleStartSession}
            disabled={!artStyle || loading}
          >
            {loading ? 'Creating Session...' : `Pay $${sessionFee} & Start Designing`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
