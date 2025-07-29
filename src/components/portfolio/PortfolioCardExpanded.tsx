import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AnalyzedCompanyData } from '@/pages/Dashboard';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Brain,
  ExternalLink,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioCardExpandedProps {
  company: AnalyzedCompanyData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioCardExpanded({ company, isOpen, onClose }: PortfolioCardExpandedProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!company) return null;

  // Format currency values
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Get health status
  const getHealthStatus = () => {
    if (!company.confidence) return { status: 'Unknown', color: 'text-muted-foreground', icon: HelpCircle, bgColor: 'bg-muted/20' };
    
    if (company.confidence >= 4) return { 
      status: 'Healthy', 
      color: 'text-success', 
      icon: CheckCircle, 
      bgColor: 'bg-success/20 border-success/30' 
    };
    if (company.confidence >= 3) return { 
      status: 'Moderate Risk', 
      color: 'text-warning', 
      icon: AlertCircle, 
      bgColor: 'bg-warning/20 border-warning/30' 
    };
    return { 
      status: 'High Risk', 
      color: 'text-destructive', 
      icon: AlertTriangle, 
      bgColor: 'bg-destructive/20 border-destructive/30' 
    };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-accent/30 max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-orbitron text-2xl text-foreground tracking-wider">
                {company.companyName}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="border-accent/50 text-accent">
                  {company.industry || 'Technology'}
                </Badge>
                <div className={cn("flex items-center gap-2 px-3 py-1 rounded-lg border", healthStatus.bgColor)}>
                  <HealthIcon className={cn("h-4 w-4", healthStatus.color)} />
                  <span className={cn("text-sm font-medium", healthStatus.color)}>
                    {healthStatus.status}
                  </span>
                </div>
                {company.confidence && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">
                      {company.confidence}/5 Confidence
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
              <TabsTrigger value="valuation" className="text-xs">Valuation</TabsTrigger>
              <TabsTrigger value="ai-analysis" className="text-xs">AI Analysis</TabsTrigger>
              <TabsTrigger value="investment" className="text-xs">Investment</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron">Company Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Industry</span>
                      <span className="text-sm font-medium">{company.industry || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TAM</span>
                      <span className="text-sm font-medium">{formatCurrency(company.tam)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Exit Timeline</span>
                      <span className="text-sm font-medium">{company.exitTimeline || 3} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Exit Activity</span>
                      <span className="text-sm font-medium">{company.exitActivity || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current MOIC</span>
                      <span className="text-sm font-medium">
                        {company.moic ? `${company.moic.toFixed(2)}x` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue Growth</span>
                      <span className="text-sm font-medium">
                        {formatPercentage(company.revenueGrowth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Runway</span>
                      <span className="text-sm font-medium">
                        {company.runway ? `${company.runway} months` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investor Interest</span>
                      <span className="text-sm font-medium">{company.investorInterest || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      Revenue Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ARR</span>
                      <span className="text-sm font-medium">{formatCurrency(company.arr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-sm font-medium">{formatCurrency(company.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue Growth</span>
                      <span className="text-sm font-medium">{formatPercentage(company.revenueGrowth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Projected Growth</span>
                      <span className="text-sm font-medium">{formatPercentage(company.projectedRevenueGrowth)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Efficiency Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Burn Multiple</span>
                      <span className="text-sm font-medium">
                        {company.burnMultiple ? `${company.burnMultiple.toFixed(2)}x` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Runway</span>
                      <span className="text-sm font-medium">
                        {company.runway ? `${company.runway} months` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Capital Efficiency</span>
                      <span className="text-sm font-medium">
                        {company.burnMultiple && company.burnMultiple < 2 ? 'Excellent' : 
                         company.burnMultiple && company.burnMultiple < 3 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Valuation Tab */}
            <TabsContent value="valuation" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple" />
                      Current Valuation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pre-Money</span>
                      <span className="text-sm font-medium">{formatCurrency(company.preMoneyValuation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Post-Money</span>
                      <span className="text-sm font-medium">{formatCurrency(company.postMoneyValuation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current MOIC</span>
                      <span className="text-sm font-medium">
                        {company.moic ? `${company.moic.toFixed(2)}x` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-orbitron flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-accent" />
                      Our Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Equity Stake</span>
                      <span className="text-sm font-medium">{formatPercentage(company.equityStake)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Investment</span>
                      <span className="text-sm font-medium">{formatCurrency(company.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <span className="text-sm font-medium">
                        {company.moic && company.totalInvestment 
                          ? formatCurrency(company.moic * company.totalInvestment)
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="ai-analysis" className="space-y-4 mt-6">
              {company.recommendation ? (
                <div className="space-y-4">
                  <Card className="glass-card border-accent/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-orbitron flex items-center gap-2">
                        <Brain className="h-4 w-4 text-accent" />
                        AI Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Recommendation</h4>
                          <Badge variant="outline" className="border-accent text-accent">
                            {company.recommendation}
                          </Badge>
                        </div>
                        
                        {company.confidence && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Confidence Score</h4>
                            <div className="flex items-center gap-3">
                              <Progress value={(company.confidence / 5) * 100} className="flex-1" />
                              <span className="text-sm text-muted-foreground">{company.confidence}/5</span>
                            </div>
                          </div>
                        )}
                        
                        {company.reasoning && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Analysis Reasoning</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {company.reasoning}
                            </p>
                          </div>
                        )}
                        
                        {company.keyRisks && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              Key Risks
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {company.keyRisks}
                            </p>
                          </div>
                        )}
                        
                        {company.suggestedAction && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Suggested Action</h4>
                            <p className="text-sm text-accent leading-relaxed">
                              {company.suggestedAction}
                            </p>
                          </div>
                        )}
                        
                        {company.projectedExitValueRange && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Projected Exit Value</h4>
                            <p className="text-sm text-success leading-relaxed">
                              {company.projectedExitValueRange}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {company.riskAdjustedMonetizationSummary && (
                    <Card className="glass-card border-purple/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-orbitron text-purple">
                          Risk-Adjusted Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground leading-relaxed">
                          {company.riskAdjustedMonetizationSummary}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {company.externalSources && (
                    <Card className="glass-card border-warning/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-orbitron flex items-center gap-2 text-warning">
                          <ExternalLink className="h-4 w-4" />
                          External Research
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {company.externalSources}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No AI analysis available for this company
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Investment Tab */}
            <TabsContent value="investment" className="space-y-4 mt-6">
              <div className="space-y-4">
                {company.additionalInvestmentRequested && company.additionalInvestmentRequested > 0 && (
                  <Card className="glass-card border-warning/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-orbitron text-warning">
                        Investment Request
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Additional Capital Requested</span>
                        <span className="text-lg font-bold text-warning">
                          {formatCurrency(company.additionalInvestmentRequested)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-orbitron">Investment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Round Complexity</span>
                        <span className="text-sm font-medium">{company.roundComplexity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Timing Bucket</span>
                        <span className="text-sm font-medium">{company.timingBucket || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Barrier to Entry</span>
                        <span className="text-sm font-medium">{company.barrierToEntry || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-orbitron">Portfolio Impact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Allocation</span>
                        <span className="text-sm font-medium">
                          {company.totalInvestment && company.equityStake 
                            ? `${((company.totalInvestment / 10000000) * 100).toFixed(2)}%` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Level</span>
                        <span className={cn("text-sm font-medium", healthStatus.color)}>
                          {healthStatus.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}