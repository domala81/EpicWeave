'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Message {
  messageId: string;
  role: 'user' | 'assistant';
  content: string | null;
  imageUrl: string | null;
  mythology: string | null;
  iterationNumber: number | null;
  createdAt: string;
}

interface SessionStatus {
  sessionId: string;
  status: 'active' | 'completed' | 'expired';
  artStyleChoice: string;
  iterationCount: number;
  maxIterations: number;
  latestImageUrl: string | null;
  latestJobStatus: string | null;
  latestJobError: string | null;
  expiresAt: number;
  messages: Message[];
}

export default function DesignSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionStatus | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [polling, setPolling] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';
  const authHeader = { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idToken') : ''}` };

  useEffect(() => {
    if (sessionId) fetchSessionStatus();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessionStatus = async () => {
    try {
      const res = await fetch(`${apiEndpoint}/sessions/${sessionId}/status`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error('Failed to fetch session');
      const data: SessionStatus = await res.json();
      setSession(data);
      setMessages(data.messages || []);

      // If a job is in progress, start polling
      if (data.latestJobStatus === 'processing') {
        startPolling();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiEndpoint}/sessions/${sessionId}/status`, {
          headers: authHeader,
        });
        if (!res.ok) return;
        const data: SessionStatus = await res.json();
        setSession(data);
        setMessages(data.messages || []);

        if (data.latestJobStatus !== 'processing') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPolling(false);
          setGenerating(false);
          if (data.latestJobStatus === 'completed') {
            toast.success('Design generated!');
          } else if (data.latestJobStatus === 'failed') {
            toast.error(data.latestJobError || 'Generation failed. Try again.');
          }
        }
      } catch { /* silent retry */ }
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a design prompt');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${apiEndpoint}/sessions/${sessionId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to generate design');
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPrompt('');

      // Add optimistic user message
      setMessages(prev => [...prev, {
        messageId: data.messageId,
        role: 'user',
        content: prompt.trim(),
        imageUrl: null,
        mythology: null,
        iterationNumber: data.iterationCount,
        createdAt: new Date().toISOString(),
      }]);

      // Update session iteration count
      setSession(prev => prev ? { ...prev, iterationCount: data.iterationCount } : prev);

      // Start polling for result
      startPolling();
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error('Failed to start generation');
      setGenerating(false);
    }
  };

  const handleFinalize = () => {
    if (session?.latestImageUrl) {
      router.push(`/design/${sessionId}/finalize`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const isExpired = session?.status === 'expired';
  const isMaxIterations = session ? session.iterationCount >= session.maxIterations : false;
  const canGenerate = session?.status === 'active' && !isMaxIterations && !generating;
  const hasDesign = !!session?.latestImageUrl && session.latestJobStatus === 'completed';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading design session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Session not found</p>
        <Button className="mt-4" onClick={() => router.push('/design')}>Start New Session</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl flex flex-col h-[calc(100vh-80px)]">
      {/* Session Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">AI Design Studio</h1>
          <p className="text-sm text-muted-foreground">
            {session.artStyleChoice === 'anime' ? 'Anime' : 'Modern'} Style — Hindu &amp; Greek Mythology
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isExpired ? 'destructive' : isMaxIterations ? 'secondary' : 'default'}>
            {session.iterationCount}/{session.maxIterations} iterations
          </Badge>
          <Badge variant={session.status === 'active' ? 'default' : 'destructive'}>
            {session.status}
          </Badge>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg font-medium mb-2">Welcome to the AI Design Studio!</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Describe your mythology-themed t-shirt design below. Include references to Hindu or Greek
              mythology for the best results.
            </p>
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              <Badge variant="outline">Example: &quot;Shiva meditating on Mount Kailash&quot;</Badge>
              <Badge variant="outline">Example: &quot;Zeus throwing thunderbolts&quot;</Badge>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
              <CardContent className="p-4">
                {msg.role === 'user' && msg.content && (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.role === 'assistant' && msg.imageUrl && (
                  <div>
                    <img
                      src={msg.imageUrl}
                      alt={`Design iteration ${msg.iterationNumber}`}
                      className="rounded-md max-w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Iteration {msg.iterationNumber} — {msg.mythology} mythology
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Generation spinner */}
        {generating && (
          <div className="flex justify-start">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-sm text-muted-foreground">Generating your design...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Status Banners */}
      {isExpired && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm text-center">
          Session expired. {hasDesign ? 'You can still finalize your last design.' : 'Start a new session to create designs.'}
        </div>
      )}

      {isMaxIterations && !isExpired && (
        <div className="bg-amber-100 text-amber-800 p-3 rounded-md mb-4 text-sm text-center">
          Maximum iterations reached ({session.maxIterations}/{session.maxIterations}).
          {hasDesign ? ' Select color, size, and placement to finalize your design.' : ''}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <Input
            placeholder={
              isExpired ? 'Session expired'
              : isMaxIterations ? 'Max iterations reached'
              : 'Describe your mythology-themed design...'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canGenerate}
            className="flex-1"
          />
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || !prompt.trim()}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
          {hasDesign && (
            <Button variant="secondary" onClick={handleFinalize}>
              Finalize Design
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tips: Include mythology names like &quot;Shiva&quot;, &quot;Zeus&quot;, &quot;Ganesha&quot;, or &quot;Athena&quot; for best results.
        </p>
      </div>
    </div>
  );
}
