
import { useState } from 'react';
import { Search, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PerplexityKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isAnalyzing: boolean;
}

export function PerplexityKeyInput({ onApiKeySubmit, isAnalyzing }: PerplexityKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!apiKey.trim()) {
      setError('Please enter your Perplexity API key');
      return;
    }
    
    if (!apiKey.startsWith('pplx-')) {
      setError('Perplexity API keys should start with "pplx-"');
      return;
    }
    
    onApiKeySubmit(apiKey.trim());
  };

  return (
    <Card className="max-w-md mx-auto shadow-soft">
      <CardHeader className="text-center">
        <Search className="mx-auto h-8 w-8 text-primary mb-2" />
        <CardTitle className="text-lg">Connect Perplexity API</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your Perplexity API key to enable real-time external research
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="perplexity-key">Perplexity API Key</Label>
            <Input
              id="perplexity-key"
              type="password"
              placeholder="pplx-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isAnalyzing || !apiKey.trim()}
          >
            {isAnalyzing ? 'Setting up Research...' : 'Connect Research API'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <p className="text-xs text-muted-foreground mb-2">
            <strong>Note:</strong> Your API key is stored locally and used for real-time market research.
          </p>
          <a 
            href="https://docs.perplexity.ai/docs/getting-started" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center"
          >
            Get your Perplexity API key <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
