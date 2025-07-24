import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisTable } from '@/components/AnalysisTable';
import { CombinedApiKeyInput } from '@/components/CombinedApiKeyInput';
import { ApiKeyStatus } from '@/components/ApiKeyStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyzePortfolio } from '@/utils/openaiAnalysis';
import { parseExcelFile, RawCompanyData } from '@/utils/excelParser';
import { getPerplexityApiKey, setPerplexityApiKey } from '@/utils/externalResearch';

// Extended interface for analyzed companies
interface AnalyzedCompanyData extends RawCompanyData {
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  externalSources?: string;
  insufficientData?: boolean;
}

export function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<AnalyzedCompanyData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    try {
      console.log('Parsing Excel file:', file.name);
      const parsedCompanies = await parseExcelFile(file);
      
      setCompanies(parsedCompanies);
      setUploadedFile(file);
      
      toast({
        title: "File Uploaded Successfully",
        description: `Loaded ${parsedCompanies.length} companies from your Excel file`,
      });
      
      console.log('Parsed companies:', parsedCompanies);
      
    } catch (error) {
      console.error('File parsing failed:', error);
      toast({
        title: "File Upload Failed",
        description: error instanceof Error ? error.message : "Failed to parse Excel file",
        variant: "destructive",
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAnalyze = () => {
    if (companies.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please upload an Excel file with company data first",
        variant: "destructive",
      });
      return;
    }

    // Check for OpenAI API key
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (!storedApiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key first",
        variant: "destructive",
      });
      setShowApiInput(true);
      return;
    }

    // If OpenAI key exists, proceed with analysis
    runAnalysis(storedApiKey);
  };

  const handleApiKeysSubmit = async (openaiKey: string, perplexityKey?: string) => {
    localStorage.setItem('openai_api_key', openaiKey);
    
    if (perplexityKey) {
      setPerplexityApiKey(perplexityKey);
    }
    
    // Refresh the API key status
    if ((window as any).refreshApiKeyStatus) {
      (window as any).refreshApiKeyStatus();
    }
    
    setShowApiInput(false);
    
    toast({
      title: "API Keys Configured",
      description: perplexityKey 
        ? "OpenAI and Perplexity API keys have been saved successfully"
        : "OpenAI API key has been saved successfully",
    });
  };

  const runAnalysis = async (apiKey: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus('Preparing analysis...');
    
    try {
      const rawCompanies = companies.map(company => ({
        id: company.id,
        companyName: company.companyName,
        totalInvestment: company.totalInvestment,
        equityStake: company.equityStake,
        moic: company.moic,
        revenueGrowth: company.revenueGrowth,
        burnMultiple: company.burnMultiple,
        runway: company.runway,
        tam: company.tam,
        exitActivity: company.exitActivity,
        barrierToEntry: company.barrierToEntry,
        additionalInvestmentRequested: company.additionalInvestmentRequested,
        industry: company.industry || 'N/A',
        investorInterest: company.investorInterest
      }));
      
      const analyzedCompanies = await analyzePortfolio(
        rawCompanies, 
        apiKey,
        (progress, status) => {
          setAnalysisProgress(progress);
          if (status) setAnalysisStatus(status);
        }
      );
      
      setCompanies(analyzedCompanies as AnalyzedCompanyData[]);
      toast({
        title: "Analysis Complete",
        description: getPerplexityApiKey() 
          ? `Successfully analyzed ${analyzedCompanies.length} companies with external research`
          : `Successfully analyzed ${analyzedCompanies.length} companies (internal data only)`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStatus('');
    }
  };

  // Calculate metrics safely
  const totalPortfolioValue = companies.reduce((sum, company) => sum + (company.totalInvestment || 0), 0);
  const totalRequested = companies.reduce((sum, company) => sum + (company.additionalInvestmentRequested || 0), 0);
  const validMOICs = companies.filter(company => company.moic !== null && company.moic !== undefined);
  const avgMOIC = validMOICs.length > 0 ? validMOICs.reduce((sum, company) => sum + company.moic!, 0) / validMOICs.length : 0;
  const highRiskCount = companies.filter(company => company.confidence && company.confidence <= 2).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* API Key Status - Always visible */}
        <div className="mb-6">
          <ApiKeyStatus onConfigureClick={() => setShowApiInput(true)} />
        </div>

        {!uploadedFile ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                AI-Powered Portfolio Analysis
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your portfolio data to receive objective, risk-adjusted recommendations 
                for capital deployment decisions backed by AI analysis and real-time market research.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileUpload} />
            {isParsingFile && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground">Parsing Excel file...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info Card */}
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Loaded from:</p>
                    <p className="font-medium">{uploadedFile.name}</p>
                  </div>
                  <Badge variant="outline">{companies.length} companies</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(totalPortfolioValue / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {companies.length} companies
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Capital Requested</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(totalRequested / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total ask amount
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg MOIC</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avgMOIC > 0 ? `${avgMOIC.toFixed(1)}x` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Portfolio multiple
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{highRiskCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Low confidence deals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Table */}
            <AnalysisTable 
              companies={companies}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
              analysisStatus={analysisStatus}
            />
          </div>
        )}
        
        {/* Combined API Key Input Modal - Always available */}
        {showApiInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-lg w-full mx-4">
              <CombinedApiKeyInput 
                onApiKeysSubmit={handleApiKeysSubmit}
                isAnalyzing={isAnalyzing}
              />
              <button
                onClick={() => setShowApiInput(false)}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
