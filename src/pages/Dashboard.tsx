import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisTable } from '@/components/AnalysisTable';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyzePortfolio } from '@/utils/openaiAnalysis';

// Mock data demonstrating sophisticated LLM analysis framework
const mockCompanies = [
  {
    id: '1',
    companyName: 'TechFlow Solutions',
    totalInvestment: 2500000,
    equityStake: 15.2,
    moic: 2.3,
    revenueGrowth: 145.0,
    burnMultiple: 1.8,
    runway: 18,
    tam: 4,
    exitActivity: 'High',
    barrierToEntry: 3,
    additionalInvestmentRequested: 1500000,
    recommendation: 'Invest $1.2M of $1.5M request',
    timingBucket: 'Double Down',
    reasoning: 'Company shows 145% YoY growth with recent $8M Series B led by Andreessen Horowitz, validating product-market fit in enterprise automation. LinkedIn data shows 40% headcount growth in Q3, particularly in sales roles, suggesting strong commercial momentum. However, elevated burn multiple (1.8x) requires monitoring, though justified by TAM expansion and proven unit economics. Strategic investment warranted given exit environment and defensible moat.',
    confidence: 4,
    keyRisks: 'Intensifying competition from Microsoft and Salesforce entering automation space; potential customer concentration risk with enterprise clients.',
    suggestedAction: 'Deploy capital with quarterly burn monitoring and customer diversification milestones.',
    externalSources: 'Crunchbase (Series B data), LinkedIn (hiring trends), TechCrunch coverage',
    insufficientData: false
  },
  {
    id: '2',
    companyName: 'DataVault Inc',
    totalInvestment: 4200000,
    equityStake: 22.8,
    moic: 1.1,
    revenueGrowth: 28.5,
    burnMultiple: 3.2,
    runway: 12,
    tam: 5,
    exitActivity: 'Moderate',
    barrierToEntry: 4,
    additionalInvestmentRequested: 3000000,
    recommendation: 'Bridge Capital Only - $800K',
    timingBucket: 'Bridge Capital Only',
    reasoning: 'Massive TAM (5/5) with proprietary dataset moat, but 28% growth deceleration and 3.2x burn multiple signal execution risk. Glassdoor reviews show 15% engineering turnover in Q3, though recent AWS partnership validates technical capabilities. Bridge capital justified to reach Series B milestones while monitoring unit economics and team stability.',
    confidence: 2,
    keyRisks: 'Critical 12-month runway with unproven unit economics at scale; potential technical debt from rapid scaling.',
    suggestedAction: 'Deploy $800K bridge with milestone-based releases tied to burn reduction and customer retention metrics.',
    externalSources: 'Glassdoor (turnover data), AWS press release, PitchBook (sector analysis)',
    insufficientData: false
  },
  {
    id: '3',
    companyName: 'GreenLogistics Co',
    totalInvestment: 1800000,
    equityStake: 18.5,
    moic: 0.8,
    revenueGrowth: -12.3,
    burnMultiple: 4.1,
    runway: 8,
    tam: 3,
    exitActivity: 'Low',
    barrierToEntry: 2,
    additionalInvestmentRequested: 2200000,
    recommendation: 'Decline',
    timingBucket: 'Decline',
    reasoning: 'Declining revenue (-12% YoY) and deteriorating burn efficiency (4.1x) indicate fundamental model failure. LinkedIn shows 30% workforce reduction and CEO departure rumors on industry forums. Limited sustainability exits in logistics sector per PitchBook. Risk of total capital loss outweighs any recovery scenarios.',
    confidence: 5,
    keyRisks: 'Imminent cash depletion within 8 months; potential total loss of $1.8M investment without viable pivot path.',
    suggestedAction: 'Initiate acqui-hire discussions with strategic logistics players to recover partial value.',
    externalSources: 'LinkedIn (workforce data), industry forums, PitchBook (exit comps)',
    insufficientData: false
  },
  {
    id: '4',
    companyName: 'NeuroTech Analytics',
    totalInvestment: 1200000,
    equityStake: 12.5,
    moic: null,
    revenueGrowth: null,
    burnMultiple: null,
    runway: null,
    tam: 4,
    exitActivity: 'High',
    barrierToEntry: 5,
    additionalInvestmentRequested: 800000,
    recommendation: 'Insufficient data to assess',
    timingBucket: 'N/A',
    reasoning: 'Missing critical inputs (growth, burn, runway metrics) prevents responsible investment evaluation. Strong TAM and exit activity suggest potential, but lack of performance visibility makes additional capital deployment highly speculative.',
    confidence: 1,
    keyRisks: 'Complete lack of visibility into operational metrics, cash efficiency, or unit economics makes investment assessment impossible.',
    suggestedAction: 'Request updated financials, burn analysis, and growth KPIs before reassessing capital deployment.',
    externalSources: 'Limited data available',
    insufficientData: true
  }
];

export function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState(mockCompanies);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    // In a real app, this would parse the Excel file
    console.log('File uploaded:', file.name);
  };

  const handleAnalyze = () => {
    // Check if we have a stored API key
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      runAnalysis(storedApiKey);
    } else {
      setShowApiInput(true);
    }
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    // Store API key locally
    localStorage.setItem('openai_api_key', apiKey);
    setShowApiInput(false);
    await runAnalysis(apiKey);
  };

  const runAnalysis = async (apiKey: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
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
        additionalInvestmentRequested: company.additionalInvestmentRequested
      }));
      
      const analyzedCompanies = await analyzePortfolio(
        rawCompanies, 
        apiKey,
        setAnalysisProgress
      );
      
      setCompanies(analyzedCompanies as any);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${analyzedCompanies.length} companies`,
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
    }
  };

  const totalPortfolioValue = companies.reduce((sum, company) => sum + company.totalInvestment, 0);
  const totalRequested = companies.reduce((sum, company) => sum + company.additionalInvestmentRequested, 0);
  const avgMOIC = companies.reduce((sum, company) => sum + company.moic, 0) / companies.length;
  const highRiskCount = companies.filter(company => company.confidence && company.confidence <= 2).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {!uploadedFile ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                AI-Powered Portfolio Analysis
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your portfolio data to receive objective, risk-adjusted recommendations 
                for capital deployment decisions backed by LLM analysis.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-6">
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
                  <div className="text-2xl font-bold">{avgMOIC.toFixed(1)}x</div>
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
            />
            
            {/* API Key Input Modal */}
            {showApiInput && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                  <ApiKeyInput 
                    onApiKeySubmit={handleApiKeySubmit}
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
          </div>
        )}
      </main>
    </div>
  );
}