
import { useState } from 'react';
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
    maComps: string[];
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number | null | undefined, suffix: string = '') => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(1)}${suffix}`;
  };

  const handleRowClick = (companyId: string) => {
    try {
      setExpandedRow(expandedRow === companyId ? null : companyId);
    } catch (error) {
      console.error('Error expanding row:', error);
    }
  };

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
                <TableHead>Industry</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>Equity</TableHead>
                <TableHead>MOIC</TableHead>
                <TableHead>TTM Growth</TableHead>
                <TableHead>Projected Growth</TableHead>
                <TableHead>Exit Timeline</TableHead>
                <TableHead>Pre-Money</TableHead>
                <TableHead>Post-Money</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Investor Interest</TableHead>
                <TableHead>Round Terms</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Projected Exit Value</TableHead>
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
                      {company.companyName}
                      {company.insufficientData && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Insufficient Data
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-muted-foreground">
                        {company.industry || 'N/A'}
                      </span>
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
                          ? `$${(company.preMoneyValuation / 1000000).toFixed(1)}M`
                          : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {company.postMoneyValuation !== null && company.postMoneyValuation !== undefined 
                            ? `$${(company.postMoneyValuation / 1000000).toFixed(1)}M`
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
                        {company.projectedExitValueRange ? (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {company.projectedExitValueRange.substring(0, 120)}
                            {company.projectedExitValueRange.length > 120 ? '...' : ''}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Pending analysis</span>
                        )}
                      </div>
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
                      <TableCell colSpan={18} className="bg-muted/20 p-6">
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
                                       ? `$${(company.preMoneyValuation / 1000000).toFixed(1)}M`
                                       : 'N/A'}
                                   </span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Post-Money:</span>
                                   <span className="ml-2 font-medium">
                                     {company.postMoneyValuation !== null && company.postMoneyValuation !== undefined 
                                       ? `$${(company.postMoneyValuation / 1000000).toFixed(1)}M`
                                       : 'N/A'}
                                     {company.preMoneyValuation && company.postMoneyValuation && (
                                       <Badge variant="outline" className="ml-1 text-xs">
                                         {((company.postMoneyValuation / company.preMoneyValuation)).toFixed(1)}x markup
                                       </Badge>
                                     )}
                                   </span>
                                 </div>
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
                                 
                                 {company.externalInsights.maComps && company.externalInsights.maComps.length > 0 && (
                                   <div>
                                     <p className="text-xs font-medium text-muted-foreground mb-1">M&A Comparables:</p>
                                     <ul className="text-xs space-y-1">
                                       {company.externalInsights.maComps.slice(0, 3).map((insight, idx) => (
                                         <li key={idx} className="text-foreground/80">• {insight.substring(0, 200)}{insight.length > 200 ? '...' : ''}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                
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
