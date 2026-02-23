'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { isAuthenticated, getIdToken, signOut, getUserEmail } from '@/lib/auth';

const SKIP_FEE = process.env.NEXT_PUBLIC_SKIP_SESSION_FEE === 'true';

export default function DesignEntryPage() {
  const router = useRouter();
  const [artStyle, setArtStyle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [bypassFee, setBypassFee] = useState(SKIP_FEE);

  useEffect(() => {
    const ok = isAuthenticated();
    setAuthed(ok);
    setUserEmail(getUserEmail());
  }, []);

  const handleStartSession = async () => {
    if (!artStyle) {
      toast.error('Please select an art style');
      return;
    }
    if (!authed) {
      router.push('/auth?redirect=/design');
      return;
    }

    setLoading(true);
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
      const response = await fetch(`${apiEndpoint}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getIdToken()}`,
        },
        body: JSON.stringify({
          artStyleChoice: artStyle,
          paymentMethodId: bypassFee ? undefined : 'pm_card_visa',
          skipPayment: bypassFee,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          toast.error('Session expired. Please sign in again.');
          signOut();
          router.push('/auth?redirect=/design');
          return;
        }
        toast.error(error.error || 'Failed to create session');
        return;
      }

      const data = await response.json();
      toast.success('Session created! Start prompting below.');
      router.push(`/design/${data.sessionId}`);
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link href="/" className="text-white/60 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-black mb-2">AI Design Studio</h1>
              <p className="text-purple-200">Generate a unique mythology-themed t-shirt design using DALL-E</p>
            </div>
            {SKIP_FEE && (
              <Badge className="bg-amber-500 text-white border-0 text-xs px-3 py-1 font-semibold mt-1">
                🧪 Test Mode
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Auth Status */}
        {!authed ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900">Sign in required</p>
              <p className="text-sm text-amber-700 mt-0.5">You need to be signed in to start an AI design session.</p>
            </div>
            <Link href="/auth?redirect=/design">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shrink-0">Sign In</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-green-800">
              Signed in as <strong>{userEmail}</strong>
            </p>
            <button
              onClick={() => { signOut(); setAuthed(false); setUserEmail(null); }}
              className="text-xs text-green-700 hover:underline"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Session Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Start AI Design Session</CardTitle>
              {bypassFee ? (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Fee bypassed</Badge>
              ) : (
                <span className="text-2xl font-black text-primary">$2.00</span>
              )}
            </div>
            <CardDescription>
              {bypassFee
                ? 'Test mode — no payment required. Session will be created immediately.'
                : 'One-time session fee gives you up to 5 AI design iterations within 1 hour.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Art Style Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Art Style</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'modern', label: 'Modern', desc: 'Clean, contemporary artistic style' },
                  { value: 'anime', label: 'Anime', desc: 'Vibrant anime-styled illustration' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setArtStyle(s.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      artStyle === s.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session Fee</span>
                <span className={`font-semibold ${bypassFee ? 'line-through text-muted-foreground' : 'text-primary'}`}>$2.00 USD</span>
              </div>
              {bypassFee && <div className="flex justify-between"><span className="text-muted-foreground">Test bypass</span><span className="text-amber-600 font-semibold">$0.00</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Max Iterations</span><span>5 designs</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Session Duration</span><span>1 hour</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Prompt Filter</span><span>Hindu &amp; Greek only</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Generator</span><span>OpenAI DALL-E</span></div>
            </div>

            {/* Prompt tips */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-purple-900 mb-2">💡 Prompt Tips</p>
              <ul className="text-purple-700 space-y-1 text-xs list-disc list-inside">
                <li>Must reference Hindu or Greek mythology</li>
                <li>Try: <em>&quot;Shiva meditating on Kailash in anime style&quot;</em></li>
                <li>Try: <em>&quot;Zeus hurling thunderbolts from Olympus&quot;</em></li>
                <li>Mention a deity, creature, or location for best results</li>
              </ul>
            </div>

            {/* Start Button */}
            <Button
              size="lg"
              className={`w-full font-bold text-base ${bypassFee ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
              onClick={handleStartSession}
              disabled={!artStyle || loading}
            >
              {loading
                ? 'Creating session...'
                : bypassFee
                  ? '🧪 Start Session (Test Mode)'
                  : `Pay $2.00 & Start Designing`}
            </Button>

            {/* Test mode toggle — only shown when SKIP_FEE flag is on */}
            {SKIP_FEE && (
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Fee Bypass</p>
                  <p className="text-xs text-muted-foreground">Toggle for testing without Stripe</p>
                </div>
                <button
                  onClick={() => setBypassFee(!bypassFee)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${bypassFee ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${bypassFee ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
