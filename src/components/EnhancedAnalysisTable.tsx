import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Download, RefreshCw, ArrowUpDown } from 'lucide-react';
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
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  externalSources?: string;
  insufficientData?: boolean;
}

interface EnhancedAnalysisTableProps {
  companies: CompanyData[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

type SortField = 'companyName' | 'totalInvestment' | 'equityStake' | 'moic' | 'revenueGrowth' | 'additionalInvestmentRequested' | 'confidence';
type SortDirection = 'asc' | 'desc';

export function EnhancedAnalysisTable({ companies, onAnalyze, isAnalyzing }: EnhancedAnalysisTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = 0;
      if (bVal === null || bVal === undefined) bVal = 0;

      // Handle string comparisons
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [companies, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-3 w-3" /> : 
      <ChevronDown className="h-3 w-3" />;
  };

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

  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null;
    
    const colors = {
      'Hold': 'bg-green-100 text-green-800 border-green-300',
      'Reinvest': 'bg-blue-100 text-blue-800 border-blue-300',
      'Exit': 'bg-red-100 text-red-800 border-red-300',
      'Monitor': 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={colors[recommendation as keyof typeof colors] || 'bg-gray-100 text-gray-800'}
      >
        {recommendation}
      </Badge>
    );
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
    setExpandedRow(expandedRow === companyId ? null : companyId);
  };

  const exportToCSV = () => {
    const headers = [
      'Company Name', 'Investment', 'Equity %', 'MOIC', 'Revenue Growth %', 
      'Requested Amount', 'Recommendation', 'Confidence', 'Key Risks'
    ];
    
    const csvData = companies.map(company => [
      company.companyName,
      company.totalInvestment,
      company.equityStake,
      company.moic || '',
      company.revenueGrowth || '',
      company.additionalInvestmentRequested,
      company.recommendation || '',
      company.confidence || '',
      (company.keyRisks || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
                <TableHead className="min-w-[200px]">
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('companyName')}
                  >
                    Company {getSortIcon('companyName')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('totalInvestment')}
                  >
                    Investment {getSortIcon('totalInvestment')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('equityStake')}
                  >
                    Equity {getSortIcon('equityStake')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('moic')}
                  >
                    MOIC {getSortIcon('moic')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('revenueGrowth')}
                  >
                    Growth {getSortIcon('revenueGrowth')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('additionalInvestmentRequested')}
                  >
                    Requested {getSortIcon('additionalInvestmentRequested')}
                  </Button>
                </TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('confidence')}
                  >
                    Confidence {getSortIcon('confidence')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
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
                    <TableCell>{formatCurrency(company.totalInvestment)}</TableCell>
                    <TableCell>{formatPercentage(company.equityStake)}</TableCell>
                    <TableCell>{formatNumber(company.moic, 'x')}</TableCell>
                    <TableCell>{formatPercentage(company.revenueGrowth)}</TableCell>
                    <TableCell>{formatCurrency(company.additionalInvestmentRequested)}</TableCell>
                    <TableCell>
                      {getRecommendationBadge(company.recommendation) || (
                        <span className="text-muted-foreground italic">Pending analysis</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(company.confidence)}
                    </TableCell>
                  </TableRow>
                  
                  {expandedRow === company.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/20 p-6">
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
