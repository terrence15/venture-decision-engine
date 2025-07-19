
import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { EnhancedAnalysisTable } from '@/components/EnhancedAnalysisTable';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { EnhancedPortfolioCharts } from '@/components/EnhancedPortfolioCharts';
import { EnhancedCompanyCard } from '@/components/EnhancedCompanyCard';
import { CompanyDetailModal } from '@/components/CompanyDetailModal';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Building2, DollarSign, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { analyzePortfolio } from '@/utils/openaiAnalysis';
import { parseEnhancedExcelFile } from '@/utils/enhancedExcelParser';
import { EnhancedCompanyData } from '@/types/portfolio';

export function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<EnhancedCompanyData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<EnhancedCompanyData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    recommendation: [] as string[],
    confidence: [] as string[],
    investmentRange: ''
  });
  
  const { toast } = useToast();

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Enhanced search and filter logic
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.companyName.toLowerCase().includes(term) ||
        company.recommendation?.toLowerCase().includes(term) ||
        company.keyRisks?.toLowerCase().includes(term) ||
        company.reasoning?.toLowerCase().includes(term) ||
        company.executive?.ceoName?.toLowerCase().includes(term) ||
        company.executive?.industryCategory?.toLowerCase().includes(term)
      );
    }

    if (filters.recommendation.length > 0) {
      filtered = filtered.filter(company => 
        filters.recommendation.includes(company.recommendation || 'Pending')
      );
    }

    if (filters.confidence.length > 0) {
      const confidenceMap = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
      filtered = filtered.filter(company => {
        const confidenceLevel = company.confidence;
        const confidenceName = Object.entries(confidenceMap).find(([_, val]) => val === confidenceLevel)?.[0];
        return confidenceName && filters.confidence.includes(confidenceName);
      });
    }

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
      console.log('Parsing enhanced Excel file:', file.name);
      const parsedCompanies = await parseEnhancedExcelFile(file);
      
      setCompanies(parsedCompanies);
      setUploadedFile(file);
      
      toast({
        title: "File Uploaded Successfully",
        description: `Loaded ${parsedCompanies.length} companies with enhanced executive data`,
      });
      
      console.log('Parsed enhanced companies:', parsedCompanies);
      
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

    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      runAnalysis(storedApiKey);
    } else {
      setShowApiInput(true);
    }
  };

  const handleApiKeySubmit = async (apiKey: string) => {
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
      
      setCompanies(analyzedCompanies as EnhancedCompanyData[]);
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

  // Calculate enhanced metrics
  const totalPortfolioValue = companies.reduce((sum, company) => sum + (company.totalInvestment || 0), 0);
  const totalRequested = companies.reduce((sum, company) => sum + (company.additionalInvestmentRequested || 0), 0);
  const validMOICs = companies.filter(company => company.moic !== null && company.moic !== undefined);
  const avgMOIC = validMOICs.length > 0 ? validMOICs.reduce((sum, company) => sum + company.moic!, 0) / validMOICs.length : 0;
  const highRiskCount = companies.filter(company => (company.riskAssessment?.overallRiskScore || 50) >= 70).length;

  if (!uploadedFile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold gradient-text mb-4">
                Portfolio Management
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI-powered investment decision support with advanced analytics and executive insights
              </p>
            </div>
            <FileUpload onFileSelect={handleFileUpload} />
            {isParsingFile && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground">Parsing Excel file with enhanced data extraction...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Portfolio Management</h1>
              <p className="text-muted-foreground">AI-powered investment decision support</p>
            </div>
            
            {/* Live Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, CEOs, industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* API Key Input */}
          <div className="flex items-center gap-3">
            <Input
              type="password"
              placeholder="OpenAI API Key (for real-time data)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-64 bg-secondary/50 border-border/50"
            />
          </div>

          {/* Portfolio Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{companies.length}</div>
                <p className="text-xs text-muted-foreground">Portfolio companies</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  ${(totalPortfolioValue / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Total invested</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Return</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {avgMOIC > 0 ? `${avgMOIC.toFixed(1)}x` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Portfolio MOIC</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk Alert</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{highRiskCount}</div>
                <p className="text-xs text-muted-foreground">
                  {highRiskCount > 0 && <Badge variant="destructive" className="text-xs">Alert</Badge>}
                  {highRiskCount === 0 && <span>Companies at risk</span>}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Portfolio Charts */}
          {companies.length > 0 && <EnhancedPortfolioCharts companies={companies} />}

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search companies, industries, or CEOs..."
              selectedFilters={filters}
              onFilterChange={setFilters}
              onClearFilters={clearFilters}
            />
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
              >
                Grid View
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
              >
                Table View
              </Button>
            </div>
          </div>

          {/* Company Grid or Table */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                   <EnhancedCompanyCard
                     key={company.id}
                     company={company}
                     onClick={() => {
                       setSelectedCompany(company);
                       setIsModalOpen(true);
                     }}
                   />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">No companies found</p>
                  <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            <EnhancedAnalysisTable 
              companies={filteredCompanies}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          )}
            
          {/* API Key Input Modal */}
          {showApiInput && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-card border border-border/50 p-6 rounded-lg max-w-md w-full mx-4 shadow-strong">
                <ApiKeyInput 
                  onApiKeySubmit={handleApiKeySubmit}
                  isAnalyzing={isAnalyzing}
                />
                <button
                  onClick={() => setShowApiInput(false)}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
           )}
        </div>

        {/* Company Detail Modal */}
        {selectedCompany && (
          <CompanyDetailModal
            company={selectedCompany}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            apiKey={apiKey}
          />
        )}
      </main>
    </div>
  );
}
