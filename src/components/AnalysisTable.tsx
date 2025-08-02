import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Memoized row component for performance
const TableRowComponent = React.memo(({ 
  company, 
  isExpanded, 
  onRowClick,
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatRevenue,
  getConfidenceBadge,
  getComplexityBadge 
}: {
  company: CompanyData;
  isExpanded: boolean;
  onRowClick: (id: string) => void;
  formatCurrency: (amount: number | null | undefined) => string;
  formatPercentage: (value: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined, suffix?: string) => string;
  formatRevenue: (revenue: number | null | undefined, arr: number | null | undefined) => { value: string; type: string; primary: boolean };
  getConfidenceBadge: (confidence?: number) => React.ReactNode;
  getComplexityBadge: (complexity?: number | null) => React.ReactNode;
}) => (
  <div 
    className="cursor-pointer hover:bg-muted/50 transition-colors border-b flex items-center min-h-[60px] will-change-transform"
    onClick={() => onRowClick(company.id)}
    style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}
  >
    <div className="w-8 p-4" style={{ display: 'table-cell' }}>
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
    <div className="font-medium min-w-[200px] p-4" style={{ display: 'table-cell' }}>
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
    </div>
    <div className="min-w-[120px] p-4" style={{ display: 'table-cell' }}>
      {company.seriesStage ? (
        <Badge variant="secondary" className="text-xs">
          {company.seriesStage}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">N/A</span>
      )}
    </div>
    <div className="min-w-[120px] p-4" style={{ display: 'table-cell' }}>
      {company.totalRaiseRequest ? (
        <span className="font-medium">
          {formatCurrency(company.totalRaiseRequest)}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </div>
    <div className="min-w-[120px] p-4" style={{ display: 'table-cell' }}>
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
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      <span className="text-sm font-medium text-muted-foreground">
        {company.industry || 'N/A'}
      </span>
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">
          {formatRevenue(company.revenue, company.arr).value}
        </span>
        {formatRevenue(company.revenue, company.arr).type !== 'N/A' && (
          <Badge variant={formatRevenue(company.revenue, company.arr).primary ? 'default' : 'secondary'} className="text-xs">
            {formatRevenue(company.revenue, company.arr).type}
          </Badge>
        )}
      </div>
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>{formatCurrency(company.totalInvestment)}</div>
    <div className="p-4" style={{ display: 'table-cell' }}>{formatPercentage(company.equityStake)}</div>
    <div className="p-4" style={{ display: 'table-cell' }}>{formatNumber(company.moic, 'x')}</div>
    <div className="p-4" style={{ display: 'table-cell' }}>{formatPercentage(company.revenueGrowth)}</div>
    <div className="p-4" style={{ display: 'table-cell' }}>
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
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      <div className="flex items-center gap-1">
        {company.revenueYearMinus2 !== null || company.revenueYearMinus1 !== null || 
         company.currentRevenue !== null || company.projectedRevenueYear1 !== null || 
         company.projectedRevenueYear2 !== null ? (
          <div className="text-xs">
            <div className="flex gap-1 items-center">
              <span className="text-muted-foreground">-2:</span>
              <span>{company.revenueYearMinus2 ? `$${(company.revenueYearMinus2 / 1000000).toFixed(1)}M` : 'N/A'}</span>
              {!company.revenueYearMinus2 && (
                <span className="text-yellow-500 text-xs" title="Historical CAGR calculation unavailable">⚠️</span>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-muted-foreground">Cur:</span>
              <span>{company.currentRevenue ? `$${(company.currentRevenue / 1000000).toFixed(1)}M` : 'N/A'}</span>
              {!company.currentRevenue && (
                <span className="text-red-500 text-xs" title="Critical: Current revenue missing">🚫</span>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-muted-foreground">+2:</span>
              <span>{company.projectedRevenueYear2 ? `$${(company.projectedRevenueYear2 / 1000000).toFixed(1)}M` : 'N/A'}</span>
              {!company.projectedRevenueYear2 && (
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
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
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
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      <div className="text-sm">
        {company.preMoneyValuation !== null && company.preMoneyValuation !== undefined 
          ? `$${(company.preMoneyValuation / 1000000).toFixed(1)}M`
          : 'N/A'}
      </div>
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      <div className="flex items-center gap-1">
        <span className="text-sm">
          {company.postMoneyValuation !== null && company.postMoneyValuation !== undefined 
            ? `$${(company.postMoneyValuation / 1000000).toFixed(1)}M`
            : 'N/A'}
        </span>
      </div>
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>{formatCurrency(company.additionalInvestmentRequested)}</div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      {company.investorInterest !== null && company.investorInterest !== undefined ? (
        <Badge variant={
          company.investorInterest >= 4 ? 'default' :
          company.investorInterest >= 3 ? 'secondary' :
          company.investorInterest >= 2 ? 'outline' : 'destructive'
        }>
          {company.investorInterest}/5
        </Badge>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      )}
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      {getComplexityBadge(company.roundComplexity)}
    </div>
    <div className="p-4 max-w-[200px]" style={{ display: 'table-cell' }}>
      <div className="truncate" title={company.recommendation || 'Pending analysis'}>
        {company.recommendation || 'Pending analysis'}
      </div>
    </div>
    <div className="p-4" style={{ display: 'table-cell' }}>
      {getConfidenceBadge(company.confidence)}
    </div>
    <div className="p-4 max-w-[300px]" style={{ display: 'table-cell' }}>
      <div className="truncate" title={company.riskAdjustedMonetizationSummary || 'Pending analysis'}>
        {company.riskAdjustedMonetizationSummary || 'Pending analysis'}
      </div>
    </div>
  </div>
));

export function AnalysisTable({ companies, onAnalyze, isAnalyzing }: AnalysisTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const getConfidenceBadge = useCallback((confidence?: number) => {
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
  }, []);

  const getComplexityBadge = useCallback((complexity?: number | null) => {
    if (!complexity) return <Badge variant="secondary">Unknown</Badge>;
    if (complexity <= 2) return <Badge variant="destructive">High Risk ({complexity}/5)</Badge>;
    if (complexity === 3) return <Badge variant="secondary">Review Terms ({complexity}/5)</Badge>;
    return <Badge variant="default">Clean Terms ({complexity}/5)</Badge>;
  }, []);

  const formatCurrency = useCallback((amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    if (arr !== null && arr !== undefined && arr > 0) {
      return {
        value: `$${(arr / 1000000).toFixed(1)}M`,
        type: 'ARR',
        primary: true
      };
    } else if (revenue !== null && revenue !== undefined && revenue > 0) {
      return {
        value: `$${(revenue / 1000000).toFixed(1)}M`,
        type: 'Revenue',
        primary: false
      };
    }
    return {
      value: 'N/A',
      type: 'N/A',
      primary: false
    };
  }, []);

  const handleRowClick = useCallback((companyId: string) => {
    try {
      setExpandedRow(expandedRow === companyId ? null : companyId);
    } catch (error) {
      console.error('Error expanding row:', error);
    }
  }, [expandedRow]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: companies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => expandedRow ? 400 : 60,
    overscan: 5,
  });

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
        <ScrollArea className="h-[600px]" ref={parentRef}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Table style={{ tableLayout: 'fixed' }}>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
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
            </Table>
            
            <div style={{ position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const company = companies[virtualRow.index];
                const isExpanded = expandedRow === company.id;
                
                return (
                  <div
                    key={`${company.id}-${virtualRow.key}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TableRowComponent
                      company={company}
                      isExpanded={isExpanded}
                      onRowClick={handleRowClick}
                      formatCurrency={formatCurrency}
                      formatPercentage={formatPercentage}
                      formatNumber={formatNumber}
                      formatRevenue={formatRevenue}
                      getConfidenceBadge={getConfidenceBadge}
                      getComplexityBadge={getComplexityBadge}
                    />
                    
                    {isExpanded && (
                      <div className="border-b bg-muted/20 p-6 space-y-6">
                        {/* Expanded content here - simplified for brevity */}
                        <div className="text-sm space-y-2">
                          <h4 className="font-medium">Detailed Analysis</h4>
                          {company.reasoning && (
                            <div className="bg-background border rounded-lg p-4">
                              <p className="text-sm leading-relaxed">{company.reasoning}</p>
                            </div>
                          )}
                          {company.keyRisks && (
                            <div className="bg-background border rounded-lg p-4">
                              <h5 className="font-medium mb-2">Key Risks</h5>
                              <p className="text-sm leading-relaxed">{company.keyRisks}</p>
                            </div>
                          )}
                          {company.suggestedAction && (
                            <div className="bg-background border rounded-lg p-4">
                              <h5 className="font-medium mb-2">Suggested Actions</h5>
                              <p className="text-sm leading-relaxed">{company.suggestedAction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}