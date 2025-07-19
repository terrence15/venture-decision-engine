import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisTable } from '@/components/AnalysisTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

// Mock data for demonstration
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
    reasoning: 'Strong revenue growth momentum with improving burn efficiency. TAM expansion indicates scalable opportunity. High exit activity provides favorable liquidity environment.',
    confidence: 4,
    keyRisks: 'Competitive landscape intensifying with well-funded players entering market.',
    suggestedAction: 'Schedule due diligence call to validate Q4 pipeline strength before commitment.'
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
    reasoning: 'Massive TAM with strong IP moat, but concerning burn rate and slowing growth indicate execution challenges. Bridge to Series B fundraise.',
    confidence: 2,
    keyRisks: 'Cash runway critical with unproven unit economics at scale.',
    suggestedAction: 'Request detailed burn plan and milestone-based funding structure.'
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
    reasoning: 'Negative revenue growth combined with high burn multiple indicates fundamental business model issues. Limited exit opportunities in sector.',
    confidence: 5,
    keyRisks: 'Potential total loss of investment within 12 months without major pivot.',
    suggestedAction: 'Explore acqui-hire opportunities to preserve some value recovery.'
  }
];

export function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState(mockCompanies);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    // In a real app, this would parse the Excel file
    console.log('File uploaded:', file.name);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
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
          </div>
        )}
      </main>
    </div>
  );
}