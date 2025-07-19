
import { useState } from 'react';
import { Key, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface CombinedApiKeyInputProps {
  onApiKeysSubmit: (openaiKey: string, perplexityKey?: string) => void;
  isAnalyzing: boolean;
}

export function CombinedApiKeyInput({ onApiKeysSubmit, isAnalyzing }: CombinedApiKeyInputProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!openaiKey.trim()) {
      setError('OpenAI API key is required');
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
    
    onApiKeysSubmit(openaiKey.trim(), perplexityKey.trim() || undefined);
  };

  const handleOpenAIOnlySubmit = () => {
    setError(null);
    
    if (!openaiKey.trim()) {
      setError('OpenAI API key is required');
      return;
    }
    
    if (!openaiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }
    
    onApiKeysSubmit(openaiKey.trim());
  };

  return (
    <Card className="max-w-lg mx-auto shadow-soft">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Key className="h-6 w-6 text-primary" />
          <Search className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Connect API Services</CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your API keys to enable AI-powered portfolio analysis
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OpenAI API Key - Required */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </div>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Powers the core AI analysis and investment recommendations
            </p>
          </div>

          {/* Perplexity API Key - Optional */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="perplexity-key">Perplexity API Key</Label>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            <Input
              id="perplexity-key"
              type="password"
              placeholder="pplx-... (optional)"
              value={perplexityKey}
              onChange={(e) => setPerplexityKey(e.target.value)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Enables real-time market research and competitive intelligence
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isAnalyzing || !openaiKey.trim()}
            >
              {isAnalyzing ? 'Analyzing Portfolio...' : 'Connect & Analyze with Full Research'}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              disabled={isAnalyzing || !openaiKey.trim()}
              onClick={handleOpenAIOnlySubmit}
            >
              Analyze with OpenAI Only
            </Button>
          </div>
        </form>
        
        <div className="mt-6 space-y-3">
          <div className="p-3 bg-muted/30 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Note:</strong> Your API keys are stored locally in your browser and are not shared with our servers.
            </p>
            <div className="flex flex-col gap-1">
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center"
              >
                Get OpenAI API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              <a 
                href="https://docs.perplexity.ai/docs/getting-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center"
              >
                Get Perplexity API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
