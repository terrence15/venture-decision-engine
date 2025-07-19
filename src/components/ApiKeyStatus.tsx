
import { useState, useEffect } from 'react';
import { Key, Search, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPerplexityApiKey } from '@/utils/externalResearch';

interface ApiKeyStatusProps {
  onConfigureClick: () => void;
}

export function ApiKeyStatus({ onConfigureClick }: ApiKeyStatusProps) {
  const [openaiConnected, setOpenaiConnected] = useState(false);
  const [perplexityConnected, setPerplexityConnected] = useState(false);

  useEffect(() => {
    // Check if API keys are stored
    const openaiKey = localStorage.getItem('openai_api_key');
    const perplexityKey = getPerplexityApiKey();
    
    setOpenaiConnected(!!openaiKey);
    setPerplexityConnected(!!perplexityKey);
  }, []);

  // Refresh status when called externally
  const refreshStatus = () => {
    const openaiKey = localStorage.getItem('openai_api_key');
    const perplexityKey = getPerplexityApiKey();
    
    setOpenaiConnected(!!openaiKey);
    setPerplexityConnected(!!perplexKey);
  };

  // Expose refresh function to parent
  useEffect(() => {
    (window as any).refreshApiKeyStatus = refreshStatus;
    return () => {
      delete (window as any).refreshApiKeyStatus;
    };
  }, []);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">API Configuration</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {openaiConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">OpenAI</span>
                <Badge variant={openaiConnected ? "default" : "secondary"} className="text-xs">
                  {openaiConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {perplexityConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <Search className="h-4 w-4" />
                <span className="text-sm">Perplexity</span>
                <Badge variant={perplexityConnected ? "default" : "secondary"} className="text-xs">
                  {perplexityConnected ? "Connected" : "Optional"}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onConfigureClick}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Configure API Keys</span>
          </Button>
        </div>
        
        {!openaiConnected && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              <strong>OpenAI API key required:</strong> Connect your OpenAI API key to enable portfolio analysis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
