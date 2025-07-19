
import { useState } from 'react';
import { Key, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyInputProps {
  onApiKeySubmit: (openaiKey: string, perplexityKey?: string) => void;
  isAnalyzing: boolean;
}

export function ApiKeyInput({ onApiKeySubmit, isAnalyzing }: ApiKeyInputProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!openaiKey.trim()) {
      setError('OpenAI API key is required for portfolio analysis');
      return;
    }
    
    if (!openaiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    if (perplexityKey.trim() && !perplexityKey.startsWith('pplx-')) {
      setError('Perplexity API keys should start with "pplx-"');
      return;
    }
    
    onApiKeySubmit(openaiKey.trim(), perplexityKey.trim() || undefined);
  };

  return (
    <Card className="max-w-lg mx-auto shadow-soft">
      <CardHeader className="text-center">
        <Key className="mx-auto h-8 w-8 text-primary mb-2" />
        <CardTitle className="text-lg">Connect API Services</CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your API keys to enable comprehensive AI-powered portfolio analysis
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key (Required)</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Required for AI investment analysis and decision support
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perplexity-key">Perplexity API Key (Optional)</Label>
            <Input
              id="perplexity-key"
              type="password"
              placeholder="pplx-..."
              value={perplexityKey}
              onChange={(e) => setPerplexityKey(e.target.value)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Optional - enables real-time external research from Crunchbase, LinkedIn, TechCrunch
            </p>
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
            disabled={isAnalyzing || !openaiKey.trim()}
          >
            {isAnalyzing ? 'Analyzing Portfolio...' : 'Connect & Analyze'}
          </Button>
        </form>
        
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-muted/30 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Note:</strong> Your API keys are stored locally in your browser and are not shared with our servers.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 text-xs">
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              Get OpenAI API key <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            <a 
              href="https://www.perplexity.ai/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              Get Perplexity API key <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
