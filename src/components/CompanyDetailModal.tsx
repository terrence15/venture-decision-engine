
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  AlertTriangle,
  Target,
  Users,
  Building,
  LineChart,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { EnhancedCompanyData } from '@/types/portfolio';
import { getEnhancedCompanyData } from '@/utils/enhancedCompanyAnalysis';
import { useToast } from '@/hooks/use-toast';

interface CompanyDetailModalProps {
  company: EnhancedCompanyData;
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

export function CompanyDetailModal({ company, isOpen, onClose, apiKey }: CompanyDetailModalProps) {
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && apiKey && company.companyName) {
      // Check if we already have enhanced data
      const hasEnhancedData = company.executive?.ceoName && 
                             company.executive?.managementScore && 
                             company.riskAssessment?.overallRiskScore;
      
      if (!hasEnhancedData) {
        fetchEnhancedData();
      } else {
        // Use existing enhanced data
        setEnhancedData({
          ceoName: company.executive?.ceoName,
          managementScore: company.executive?.managementScore,
          overallRiskScore: company.riskAssessment?.overallRiskScore,
          marketRiskScore: company.riskAssessment?.marketRiskScore,
          keyStrengths: company.executive?.keyStrengths,
          riskFactors: company.riskAssessment?.riskFactors,
          recommendation: company.recommendation,
          reasoning: company.reasoning,
          currentValuation: company.currentValuation,
          totalReturn: company.totalReturn,
          lastFundingDate: company.executive?.lastFundingDate,
          industryCategory: company.executive?.industryCategory,
          fundingStage: company.executive?.fundingStage
        });
      }
    }
  }, [isOpen, company.companyName, apiKey]);

  const fetchEnhancedData = async () => {
    if (!apiKey || !company.companyName) return;
    
    setIsLoading(true);
    try {
      console.log(`Fetching enhanced data for ${company.companyName}...`);
      const data = await getEnhancedCompanyData(company.companyName, apiKey);
      setEnhancedData(data);
      console.log(`Enhanced data loaded for ${company.companyName}:`, data);
    } catch (error) {
      console.error(`Failed to fetch enhanced data for ${company.companyName}:`, error);
      toast({
        title: "Enhanced Data Unavailable",
        description: "Using available company data. Enhanced analysis requires valid API key.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'Reinvest': return 'bg-gradient-to-r from-green-500 to-green-400 text-white';
      case 'Hold': return 'bg-gradient-to-r from-blue-500 to-blue-400 text-white';
      case 'Exit': return 'bg-gradient-to-r from-red-500 to-red-400 text-white';
      case 'Monitor': return 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-gradient-to-r from-red-500 to-red-400', text: 'text-destructive' };
    if (score >= 40) return { bg: 'bg-gradient-to-r from-yellow-500 to-yellow-400', text: 'text-warning' };
    return { bg: 'bg-gradient-to-r from-green-500 to-green-400', text: 'text-success' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Use enhanced data if available, otherwise fall back to company data
  const ceoName = enhancedData?.ceoName || company.executive?.ceoName || 'CEO TBD';
  const managementScore = enhancedData?.managementScore || company.executive?.managementScore || 75;
  const overallRiskScore = enhancedData?.overallRiskScore || company.riskAssessment?.overallRiskScore || 50;
  const marketRiskScore = enhancedData?.marketRiskScore || company.riskAssessment?.marketRiskScore || 65;
  const keyStrengths = enhancedData?.keyStrengths || company.executive?.keyStrengths || ['Strong management team', 'Market opportunity', 'Product-market fit'];
  const riskFactors = enhancedData?.riskFactors || company.riskAssessment?.riskFactors || ['Market volatility', 'Competitive pressure', 'Regulatory uncertainty'];
  const currentValuation = enhancedData?.currentValuation || company.currentValuation || company.totalInvestment * (company.moic || 1);
  const totalReturn = enhancedData?.totalReturn || company.totalReturn || (currentValuation - company.totalInvestment);
  const recommendation = enhancedData?.recommendation || company.recommendation || 'Hold';
  const reasoning = enhancedData?.reasoning || company.reasoning || 'Based on current market conditions and company performance.';
  const industryCategory = enhancedData?.industryCategory || company.executive?.industryCategory || 'Technology';
  const fundingStage = enhancedData?.fundingStage || company.executive?.fundingStage || 'Series A';
  const lastFundingDate = enhancedData?.lastFundingDate || company.executive?.lastFundingDate || '2023-01-01';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background/95 to-background/90 border border-border/50">
        <DialogHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {company.companyName}
              </DialogTitle>
              <p className="text-lg text-muted-foreground mt-2">
                {industryCategory} • {fundingStage}
              </p>
            </div>
            <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(recommendation)} shadow-glow`}>
              {recommendation}
            </Badge>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Fetching enhanced company data...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Performance Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-primary/20 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <DollarSign className="h-5 w-5 text-success" />
                  Financial Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground mb-1">Initial Investment</div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(company.totalInvestment)}
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground mb-1">Current Valuation</div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(currentValuation)}
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground mb-1">Return Multiple</div>
                    <div className="text-2xl font-bold text-success">
                      {(currentValuation / company.totalInvestment).toFixed(1)}x
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground mb-1">Total Return</div>
                    <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-warning/20 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Overall Risk Score</span>
                      <span className="text-sm font-bold">{overallRiskScore}/100</span>
                    </div>
                    <div className="relative">
                      <Progress value={overallRiskScore} className="h-3 bg-secondary/50" />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getRiskColor(overallRiskScore).bg}`}
                        style={{ width: `${overallRiskScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Market Risk</span>
                      <span className="text-sm font-bold">{marketRiskScore}/100</span>
                    </div>
                    <div className="relative">
                      <Progress value={marketRiskScore} className="h-3 bg-secondary/50" />
                      <div 
                        className="absolute top-0 left-0 h-3 rounded-full transition-all bg-gradient-to-r from-yellow-500 to-yellow-400"
                        style={{ width: `${marketRiskScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Risk Factors</h4>
                  <ul className="space-y-2">
                    {riskFactors.map((factor: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* AI Decision Analysis Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-accent/20 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-accent" />
                  AI Decision Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-3 ${getRecommendationColor(recommendation).includes('green') ? 'text-success' : 
                    getRecommendationColor(recommendation).includes('blue') ? 'text-primary' : 
                    getRecommendationColor(recommendation).includes('red') ? 'text-destructive' : 'text-warning'}`}>
                    {recommendation.toUpperCase()}
                  </div>
                  <p className="text-muted-foreground">{reasoning}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-success mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {keyStrengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-3 h-3 text-success" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-warning mb-3">Concerns</h4>
                    <ul className="space-y-2">
                      {riskFactors.slice(0, 3).map((concern: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <TrendingDown className="w-3 h-3 text-warning" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Management Team Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-accent/20 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Management Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Team Score</span>
                    <span className="text-sm font-bold">{managementScore}/100</span>
                  </div>
                  <div className="relative">
                    <Progress value={managementScore} className="h-2 bg-secondary/50" />
                    <div 
                      className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                      style={{ width: `${managementScore}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">CEO: </span>
                    <span className="text-muted-foreground">{ceoName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Experience: </span>
                    <span className="text-muted-foreground">
                      {enhancedData?.ceoExperience || company.executive?.ceoExperience || 10} years
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Strengths</h4>
                  <ul className="space-y-1">
                    {keyStrengths.slice(0, 3).map((strength: string, index: number) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1 h-1 bg-accent rounded-full" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Company Details Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-primary/20 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Investment Date:</span>
                  </div>
                  <div className="font-medium">
                    {company.investmentDate || '2023-01-01'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Funding:</span>
                  </div>
                  <div className="font-medium">{lastFundingDate}</div>
                  <div>
                    <span className="text-muted-foreground">Growth Rate:</span>
                  </div>
                  <div className={`font-medium ${(company.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {company.revenueGrowth ? `${company.revenueGrowth > 0 ? '+' : ''}${company.revenueGrowth.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                  </div>
                  <div className="font-medium">{fundingStage}</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="card-hover bg-gradient-to-br from-card/80 to-card/60 border border-border/30 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <LineChart className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Review
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Award className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
