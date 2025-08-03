
import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CompanyData {
  id: string;
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  projectedRevenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  industry: string;
  investorInterest: number | null;
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
  roundComplexity: number | null;
  exitTimeline: number | null;
  revenue: number | null;
  arr: number | null;
  caEquityValuation: number | null;
  isExistingInvestment: boolean;
  seriesStage: string | null;
  totalRaiseRequest: number | null;
  amountRequestedFromFirm: number | null;
  // Revenue Timeline Fields
  revenueYearMinus2?: number | null;
  revenueYearMinus1?: number | null;
  currentRevenue?: number | null;
  projectedRevenueYear1?: number | null;
  projectedRevenueYear2?: number | null;
  currentARR?: number | null;
  // Calculated Analytics
  yoyGrowthPercent?: number | null;
  historicalCAGR2Y?: number | null;
  forwardCAGR2Y?: number | null;
  forwardRevenueMultiple?: number | null;
  revenueTrajectoryScore?: number | null;
  // AI Generated Fields
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  projectedExitValueRange?: string;
  riskAdjustedMonetizationSummary?: string;
  // External Research Integration
  externalSources?: string;
  insufficientData?: boolean;
  // Enhanced external attribution
  externalInsights?: {
    marketContext: string[];
    competitivePosition: string[];
    fundingEnvironment: string[];
    industryTrends: string[];
  };
  researchQuality?: 'comprehensive' | 'limited' | 'minimal' | 'unavailable';
  sourceAttributions?: string[];
}

interface AnalysisTableProps {
  companies: CompanyData[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisProgress?: number;
  analysisStatus?: string;
}

export function AnalysisTable({ companies, onAnalyze, isAnalyzing }: AnalysisTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const variants = {
      1: { variant: "destructive" as const, label: "Very Low" },
      2: { variant: "secondary" as const, label: "Low" },
      3: { variant: "secondary" as const, label: "Medium" },
      4: { variant: "default" as const, label: "High" },
      5: { variant: "default" as const, label: "Very High" }
    };
    
    const config = variants[confidence as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getComplexityBadge = (complexity?: number | null) => {
    if (!complexity) return <Badge variant="secondary">Unknown</Badge>;
    if (complexity <= 2) return <Badge variant="destructive">High Risk ({complexity}/5)</Badge>;
    if (complexity === 3) return <Badge variant="secondary">Review Terms ({complexity}/5)</Badge>;
    return <Badge variant="default">Clean Terms ({complexity}/5)</Badge>;
  };

  const formatCurrency = useCallback((amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (absAmount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
  }, []);

  const formatPercentage = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(1)}%`;
  }, []);

  const formatNumber = useCallback((value: number | null | undefined, suffix: string = '') => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(1)}${suffix}`;
  }, []);

  const formatRevenue = useCallback((revenue: number | null | undefined, arr: number | null | undefined) => {
    const hasValidARR = arr !== null && arr !== undefined && arr > 0;
    const hasValidRevenue = revenue !== null && revenue !== undefined && revenue > 0;
    
    if (!hasValidARR && !hasValidRevenue) {
      return { value: 'N/A', type: 'N/A', primary: false };
    }
    
    // Use ARR if it's the only one available, or if it's significantly larger than revenue
    const useARR = hasValidARR && (!hasValidRevenue || (arr && revenue && arr > revenue * 1.2));
    
    if (useARR && arr) {
      const absAmount = Math.abs(arr);
      let formattedValue;
      if (absAmount >= 1000000000) {
        formattedValue = `$${(arr / 1000000000).toFixed(1)}B`;
      } else if (absAmount >= 1000000) {
        formattedValue = `$${(arr / 1000000).toFixed(1)}M`;
      } else if (absAmount >= 1000) {
        formattedValue = `$${(arr / 1000).toFixed(0)}K`;
      } else {
        formattedValue = `$${arr.toFixed(0)}`;
      }
      return { value: formattedValue, type: 'ARR', primary: true };
    } else if (hasValidRevenue && revenue) {
      const absAmount = Math.abs(revenue);
      let formattedValue;
      if (absAmount >= 1000000000) {
        formattedValue = `$${(revenue / 1000000000).toFixed(1)}B`;
      } else if (absAmount >= 1000000) {
        formattedValue = `$${(revenue / 1000000).toFixed(1)}M`;
      } else if (absAmount >= 1000) {
        formattedValue = `$${(revenue / 1000).toFixed(0)}K`;
      } else {
        formattedValue = `$${revenue.toFixed(0)}`;
      }
      return { value: formattedValue, type: 'Revenue', primary: true };
    }
    
    return { value: 'N/A', type: 'N/A', primary: false };
  }, []);

  const handleRowClick = useCallback((companyId: string) => {
    try {
      setExpandedRow(expandedRow === companyId ? null : companyId);
    } catch (error) {
      console.error('Error expanding row:', error);
    }
  }, [expandedRow]);

  return (
    <Card className="w-full shadow-medium">
      <CardHeader className="bg-gradient-subtle">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Portfolio Analysis</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={onAnalyze} 
              disabled={isAnalyzing}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run AI Analysis'
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[200px]">Company</TableHead>
                <TableHead className="min-w-[120px]">Series/Stage</TableHead>
                <TableHead className="min-w-[120px]">Total Raise</TableHead>
                <TableHead className="min-w-[120px]">Amount Requested</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>ARR/Revenue</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>Equity</TableHead>
                <TableHead>MOIC</TableHead>
                <TableHead>TTM Growth</TableHead>
                <TableHead>Projected Growth</TableHead>
                <TableHead>Revenue Timeline</TableHead>
                <TableHead>Exit Timeline</TableHead>
                <TableHead>Pre-Money</TableHead>
                <TableHead>Post-Money</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Investor Interest</TableHead>
                <TableHead>Round Terms</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Risk-Adjusted Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <>
                  <TableRow 
                    key={company.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(company.id)}
                  >
                    <TableCell>
                      {expandedRow === company.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{company.companyName}</span>
                        <Badge variant={company.isExistingInvestment ? "default" : "outline"}>
                          {company.isExistingInvestment ? "Portfolio" : "Potential"}
                        </Badge>
                        {company.insufficientData && (
                          <Badge variant="outline" className="text-xs">
                            Insufficient Data
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.seriesStage ? (
                        <Badge variant="secondary" className="text-xs">
                          {company.seriesStage}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.totalRaiseRequest ? (
                        <span className="font-medium">
                          {formatCurrency(company.totalRaiseRequest)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.amountRequestedFromFirm ? (
                        <div className="space-y-1">
                          <span className="font-medium">
                            {formatCurrency(company.amountRequestedFromFirm)}
                          </span>
                          {company.totalRaiseRequest && (
                            <div className="text-xs text-muted-foreground">
                              {((company.amountRequestedFromFirm / company.totalRaiseRequest) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-muted-foreground">
                        {company.industry || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {formatRevenue(company.revenue, company.currentARR).value}
                        </span>
                        {formatRevenue(company.revenue, company.currentARR).type !== 'N/A' && (
                          <Badge variant={formatRevenue(company.revenue, company.currentARR).primary ? 'default' : 'secondary'} className="text-xs">
                            {formatRevenue(company.revenue, company.currentARR).type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(company.totalInvestment)}</TableCell>
                    <TableCell>{formatPercentage(company.equityStake)}</TableCell>
                    <TableCell>{formatNumber(company.moic, 'x')}</TableCell>
                    <TableCell>{formatPercentage(company.revenueGrowth)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {formatPercentage(company.projectedRevenueGrowth)}
                        {company.projectedRevenueGrowth !== null && company.projectedRevenueGrowth !== undefined && (
                          <Badge variant={
                            company.projectedRevenueGrowth >= 100 ? 'default' :
                            company.projectedRevenueGrowth >= 50 ? 'secondary' :
                            company.projectedRevenueGrowth < 25 ? 'destructive' : 'outline'
                          } className="text-xs">
                            {company.projectedRevenueGrowth >= 100 ? 'Hyper' :
                             company.projectedRevenueGrowth >= 50 ? 'Strong' :
                             company.projectedRevenueGrowth < 25 ? 'Caution' : 'Moderate'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         {company.revenueYearMinus2 !== null || company.revenueYearMinus1 !== null || 
                          company.currentRevenue !== null || company.projectedRevenueYear1 !== null || 
                          company.projectedRevenueYear2 !== null ? (
                           <div className="text-xs">
                              <div className="flex gap-1 items-center">
                                <span className="text-muted-foreground">-2:</span>
                                <span>{company.revenueYearMinus2 !== null && company.revenueYearMinus2 !== undefined ? formatCurrency(company.revenueYearMinus2) : 'N/A'}</span>
                                {(company.revenueYearMinus2 === null || company.revenueYearMinus2 === undefined) && (
                                  <span className="text-yellow-500 text-xs" title="Historical CAGR calculation unavailable">⚠️</span>
                                )}
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-muted-foreground">Cur:</span>
                                 <span>{company.currentRevenue !== null && company.currentRevenue !== undefined ? formatCurrency(company.currentRevenue) : 'N/A'}</span>
                                 {(company.currentRevenue === null || company.currentRevenue === undefined) && (
                                  <span className="text-red-500 text-xs" title="Critical: Current revenue missing">🚫</span>
                                )}
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-muted-foreground">+2:</span>
                                 <span>{company.projectedRevenueYear2 !== null && company.projectedRevenueYear2 !== undefined ? formatCurrency(company.projectedRevenueYear2) : 'N/A'}</span>
                                 {(company.projectedRevenueYear2 === null || company.projectedRevenueYear2 === undefined) && (
                                  <span className="text-red-500 text-xs" title="Risk-adjusted analysis disabled">⛔</span>
                                )}
                              </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-muted-foreground">No timeline</span>
                             <span className="text-red-500 text-xs" title="Insufficient data for trajectory analysis">🚫</span>
                           </div>
                         )}
                         {company.revenueTrajectoryScore !== null && company.revenueTrajectoryScore !== undefined ? (
                           <Badge variant={
                             company.revenueTrajectoryScore >= 4 ? 'default' :
                             company.revenueTrajectoryScore >= 3 ? 'secondary' :
                             company.revenueTrajectoryScore >= 2 ? 'outline' : 'destructive'
                           } className="text-xs ml-1">
                             {company.revenueTrajectoryScore.toFixed(1)}/5
                           </Badge>
                         ) : (
                           <Badge variant="destructive" className="text-xs ml-1" title="Low confidence: Incomplete data">
                             Insufficient
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {company.exitTimeline !== null && company.exitTimeline !== undefined 
                            ? `${company.exitTimeline} years`
                            : '3 years (default)'}
                        </span>
                        {(!company.exitTimeline || company.exitTimeline === 3) && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="text-sm">
                         {company.preMoneyValuation !== null && company.preMoneyValuation !== undefined 
                           ? formatCurrency(company.preMoneyValuation)
                           : 'N/A'}
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                         <span className="text-sm">
                           {company.postMoneyValuation !== null && company.postMoneyValuation !== undefined 
                             ? formatCurrency(company.postMoneyValuation)
                             : 'N/A'}
                         </span>
                        {company.preMoneyValuation && company.postMoneyValuation && (
                          <Badge variant={
                            (company.postMoneyValuation / company.preMoneyValuation) >= 3 ? 'destructive' :
                            (company.postMoneyValuation / company.preMoneyValuation) >= 2 ? 'secondary' : 'outline'
                          } className="text-xs">
                            {((company.postMoneyValuation / company.preMoneyValuation)).toFixed(1)}x
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(company.additionalInvestmentRequested)}</TableCell>
                    <TableCell>
                      {company.investorInterest ? (
                        <Badge variant={
                          company.investorInterest >= 4 ? 'default' :
                          company.investorInterest >= 3 ? 'secondary' : 'destructive'
                        }>
                          {company.investorInterest}/5
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getComplexityBadge(company.roundComplexity)}</TableCell>
                    <TableCell>
                      {company.recommendation ? (
                        <span className="font-medium text-foreground">{company.recommendation}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Pending analysis</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(company.confidence)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {company.riskAdjustedMonetizationSummary ? (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {company.riskAdjustedMonetizationSummary.substring(0, 150)}
                            {company.riskAdjustedMonetizationSummary.length > 150 ? '...' : ''}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Pending analysis</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedRow === company.id && (
                  <TableRow>
                    <TableCell colSpan={22} className="bg-muted/20 p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Company Metrics</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Burn Multiple:</span>
                                  <span className="ml-2 font-medium">
                                    {formatNumber(company.burnMultiple, 'x')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Runway:</span>
                                  <span className="ml-2 font-medium">
                                    {company.runway !== null && company.runway !== undefined && !isNaN(company.runway) 
                                      ? `${company.runway} months` 
                                      : 'N/A'}
                                  </span>
                                </div>
                                 <div>
                                   <span className="text-muted-foreground">TAM:</span>
                                   <span className="ml-2 font-medium">
                                     {company.tam || 'N/A'}/5
                                   </span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Barrier to Entry:</span>
                                   <span className="ml-2 font-medium">
                                     {company.barrierToEntry || 'N/A'}/5
                                   </span>
                                 </div>
                                  <div>
                                     <span className="text-muted-foreground">ARR:</span>
                                     <span className="ml-2 font-medium">
                                       {company.currentARR !== null && company.currentARR !== undefined 
                                         ? formatCurrency(company.currentARR)
                                         : 'N/A'}
                                     </span>
                                     {company.currentARR !== null && company.currentARR !== undefined && company.currentARR > 0 && (
                                      <Badge variant="default" className="ml-1 text-xs">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Revenue:</span>
                                    <span className="ml-2 font-medium">
                                      {company.revenue !== null && company.revenue !== undefined && company.revenue > 0 
                                        ? formatCurrency(company.revenue)
                                        : 'N/A'}
                                    </span>
                                    {company.revenue !== null && company.revenue !== undefined && company.revenue > 0 && 
                                     (company.arr === null || company.arr === undefined || company.arr <= 0) && (
                                      <Badge variant="secondary" className="ml-1 text-xs">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                 <div>
                                   <span className="text-muted-foreground">Projected Growth:</span>
                                   <span className="ml-2 font-medium">
                                     {formatPercentage(company.projectedRevenueGrowth)}
                                   </span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Exit Timeline:</span>
                                   <span className="ml-2 font-medium">
                                     {company.exitTimeline !== null && company.exitTimeline !== undefined 
                                       ? `${company.exitTimeline} years`
                                       : '3 years (default)'}
                                   </span>
                                   {(!company.exitTimeline || company.exitTimeline === 3) && (
                                     <Badge variant="outline" className="ml-1 text-xs">
                                       Default Assumption
                                     </Badge>
                                   )}
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Investor Interest:</span>
                                   <span className="ml-2 font-medium">
                                     {company.investorInterest || 'N/A'}/5
                                   </span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Round Complexity:</span>
                                   <span className="ml-2 font-medium">
                                     {company.roundComplexity || 'N/A'}/5
                                   </span>
                                   <div className="mt-1">{getComplexityBadge(company.roundComplexity)}</div>
                                 </div>
                                  <div>
                                    <span className="text-muted-foreground">Pre-Money:</span>
                                    <span className="ml-2 font-medium">
                                      {company.preMoneyValuation !== null && company.preMoneyValuation !== undefined 
                                        ? formatCurrency(company.preMoneyValuation)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Post-Money:</span>
                                    <span className="ml-2 font-medium">
                                      {company.postMoneyValuation !== null && company.postMoneyValuation !== undefined 
                                        ? formatCurrency(company.postMoneyValuation)
                                        : 'N/A'}
                                      {company.preMoneyValuation && company.postMoneyValuation && (
                                        <Badge variant="outline" className="ml-1 text-xs">
                                          {((company.postMoneyValuation / company.preMoneyValuation)).toFixed(1)}x markup
                                        </Badge>
                                      )}
                                    </span>
                                  </div>
                                 {(company.totalRaiseRequest || company.amountRequestedFromFirm) && (
                                   <div className="col-span-2">
                                     <span className="text-muted-foreground">Fundraising:</span>
                                     <div className="ml-2 space-y-1">
                                       {company.totalRaiseRequest && (
                                         <div className="text-sm">Total Raise: <span className="font-semibold">{formatCurrency(company.totalRaiseRequest)}</span></div>
                                       )}
                                       {company.amountRequestedFromFirm && (
                                         <div className="text-sm">From Us: <span className="font-semibold">{formatCurrency(company.amountRequestedFromFirm)}</span></div>
                                       )}
                                       {company.totalRaiseRequest && company.amountRequestedFromFirm && (
                                         <div className="text-xs text-muted-foreground">
                                           {((company.amountRequestedFromFirm / company.totalRaiseRequest) * 100).toFixed(1)}% participation
                                           {company.amountRequestedFromFirm / company.totalRaiseRequest > 0.3 ? ' (Anchor investor)' : ' (Follow investor)'}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 )}
                                 <div className="col-span-2">
                                   <span className="text-muted-foreground">Exit Activity:</span>
                                   <span className="ml-2 font-medium">
                                     {company.exitActivity || 'N/A'}
                                   </span>
                                 </div>
                              </div>
                            </div>
                            
                            {company.timingBucket && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Strategic Timing</h4>
                                <Badge variant="outline">{company.timingBucket}</Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            {company.reasoning && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">AI Reasoning</h4>
                                <p className="text-sm leading-relaxed">{company.reasoning}</p>
                              </div>
                            )}
                            
                            {company.keyRisks && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Risks</h4>
                                <p className="text-sm text-destructive leading-relaxed">{company.keyRisks}</p>
                              </div>
                            )}
                            
                            {company.suggestedAction && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Suggested Action</h4>
                                <p className="text-sm font-medium leading-relaxed">{company.suggestedAction}</p>
                              </div>
                            )}
                            
                            {company.projectedExitValueRange && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">📈 Projected Exit Value Range</h4>
                                <div className="text-sm leading-relaxed bg-muted/40 p-3 rounded border border-border">
                                  <div className="whitespace-pre-wrap">{company.projectedExitValueRange}</div>
                                </div>
                              </div>
                            )}

                            {company.riskAdjustedMonetizationSummary && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">💰 Risk-Adjusted Monetization Summary</h4>
                                <div className="text-sm leading-relaxed bg-gradient-subtle p-3 rounded border border-border">
                                  <div className="whitespace-pre-wrap">{company.riskAdjustedMonetizationSummary}</div>
                                </div>
                              </div>
                            )}
                            
                             {company.externalInsights && !company.insufficientData && (
                               <div className="space-y-3">
                                 <div className="flex items-center gap-2">
                                   <h4 className="font-semibold text-sm text-muted-foreground">External Market Intelligence</h4>
                                   {company.researchQuality && (
                                     <Badge variant={
                                       company.researchQuality === 'comprehensive' ? 'default' :
                                       company.researchQuality === 'limited' ? 'secondary' :
                                       company.researchQuality === 'minimal' ? 'outline' : 'destructive'
                                     } className="text-xs">
                                       {company.researchQuality}
                                     </Badge>
                                   )}
                                 </div>
                                 
                                 {company.externalInsights.marketContext.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-1">Market Context:</p>
                                     <ul className="text-xs space-y-1">
                                       {company.externalInsights.marketContext.map((insight, i) => (
                                         <li key={i} className="text-foreground">• {insight}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                 
                                 {company.externalInsights.competitivePosition.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-1">Competitive Position:</p>
                                     <ul className="text-xs space-y-1">
                                       {company.externalInsights.competitivePosition.map((insight, i) => (
                                         <li key={i} className="text-foreground">• {insight}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                 
                                 {company.externalInsights.fundingEnvironment.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-1">Funding Environment:</p>
                                     <ul className="text-xs space-y-1">
                                       {company.externalInsights.fundingEnvironment.map((insight, i) => (
                                         <li key={i} className="text-foreground">• {insight}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}

                                 {(company as any).namedComps && (company as any).namedComps.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-2">M&A Comparables:</p>
                                     <div className="overflow-x-auto">
                                       <table className="w-full text-xs border border-border rounded">
                                         <thead className="bg-muted/50">
                                           <tr>
                                             <th className="text-left p-2 font-medium">Company</th>
                                             <th className="text-left p-2 font-medium">Acquirer</th>
                                             <th className="text-left p-2 font-medium">Year</th>
                                             <th className="text-left p-2 font-medium">Valuation</th>
                                             <th className="text-left p-2 font-medium">Multiple</th>
                                             <th className="text-left p-2 font-medium">Notes</th>
                                           </tr>
                                         </thead>
                                         <tbody>
                                           {(company as any).namedComps.map((comp: any, idx: number) => (
                                             <tr key={idx} className="border-t border-border">
                                               <td className="p-2 text-foreground font-medium">{comp.company}</td>
                                               <td className="p-2 text-muted-foreground">{comp.acquirer}</td>
                                               <td className="p-2 text-muted-foreground">{comp.year}</td>
                                               <td className="p-2 text-muted-foreground">{comp.valuation}</td>
                                               <td className="p-2">
                                                 <Badge variant="outline" className="text-xs">
                                                   {comp.multiple}
                                                 </Badge>
                                               </td>
                                               <td className="p-2 text-muted-foreground text-xs">{comp.notes}</td>
                                             </tr>
                                           ))}
                                         </tbody>
                                       </table>
                                     </div>
                                   </div>
                                 )}
                                 
                                 {company.sourceAttributions && company.sourceAttributions.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-1">Sources Referenced:</p>
                                     <p className="text-xs text-muted-foreground">{company.sourceAttributions.join(', ')}</p>
                                   </div>
                                 )}
                               </div>
                             )}
                            
                            {company.externalSources && !company.externalInsights && !company.insufficientData && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">External Research Sources</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{company.externalSources}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
