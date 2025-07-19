
import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { EnhancedAnalysisTable } from '@/components/EnhancedAnalysisTable';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyzePortfolio } from '@/utils/openaiAnalysis';
import { parseExcelFile, RawCompanyData } from '@/utils/excelParser';

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
  const [isParsingFile, setIsParsingFile] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    recommendation: [] as string[],
    confidence: [] as string[],
    investmentRange: ''
  });
  
  const { toast } = useToast();

  // Filter and search logic
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.companyName.toLowerCase().includes(term) ||
        company.recommendation?.toLowerCase().includes(term) ||
        company.keyRisks?.toLowerCase().includes(term) ||
        company.reasoning?.toLowerCase().includes(term)
      );
    }

    // Apply recommendation filter
    if (filters.recommendation.length > 0) {
      filtered = filtered.filter(company => 
        filters.recommendation.includes(company.recommendation || 'Pending')
      );
    }

    // Apply confidence filter
    if (filters.confidence.length > 0) {
      const confidenceMap = {
        'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
      };
      filtered = filtered.filter(company => {
        const confidenceLevel = company.confidence;
        const confidenceName = Object.entries(confidenceMap).find(([_, val]) => val === confidenceLevel)?.[0];
        return confidenceName && filters.confidence.includes(confidenceName);
      });
    }

    // Apply investment range filter
    if (filters.investmentRange) {
      const getInvestmentRange = (amount: number) => {
        if (amount < 1000000) return 'Under $1M';
        if (amount < 5000000) return '$1M - $5M';
        if (amount < 10000000) return '$5M - $10M';
        if (amount < 50000000) return '$10M - $50M';
        return 'Over $50M';
      };

      filtered = filtered.filter(company => 
        getInvestmentRange(company.totalInvestment) === filters.investmentRange
      );
    }

    return filtered;
  }, [companies, searchTerm, filters]);

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
      
      setCompanies(analyzedCompanies as AnalyzedCompanyData[]);
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

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      recommendation: [],
      confidence: [],
      investmentRange: ''
    });
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

            {/* Portfolio Charts */}
            {companies.length > 0 && <PortfolioCharts companies={companies} />}

            {/* Search and Filter */}
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedFilters={filters}
              onFilterChange={setFilters}
              onClearFilters={clearFilters}
            />

            {/* Enhanced Analysis Table */}
            <EnhancedAnalysisTable 
              companies={filteredCompanies}
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
