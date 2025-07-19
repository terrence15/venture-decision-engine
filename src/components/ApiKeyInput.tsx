import { useState } from 'react';
import { Key, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isAnalyzing: boolean;
}

export function ApiKeyInput({ onApiKeySubmit, isAnalyzing }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }
    
    onApiKeySubmit(apiKey.trim());
  };

  return (
    <Card className="max-w-md mx-auto shadow-soft">
      <CardHeader className="text-center">
        <Key className="mx-auto h-8 w-8 text-primary mb-2" />
        <CardTitle className="text-lg">Connect OpenAI API</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your OpenAI API key to enable AI-powered portfolio analysis
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
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
            {isAnalyzing ? 'Analyzing Portfolio...' : 'Connect & Analyze'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <p className="text-xs text-muted-foreground mb-2">
            <strong>Note:</strong> Your API key is stored locally in your browser and is not shared with our servers.
          </p>
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center"
          >
            Get your OpenAI API key <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}