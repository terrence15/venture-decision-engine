
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
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  industry: string;
  // AI Generated Fields
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  // External Research Integration
  externalSources?: string;
  insufficientData?: boolean;
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
                <TableHead>Revenue Growth</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Confidence</TableHead>
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
                    <TableCell>{formatCurrency(company.additionalInvestmentRequested)}</TableCell>
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
                  </TableRow>
                  
                  {expandedRow === company.id && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-muted/20 p-6">
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
                            
                            {company.externalSources && !company.insufficientData && (
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
