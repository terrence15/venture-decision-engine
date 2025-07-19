
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Building2, User, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { EnhancedCompanyData } from '@/types/portfolio';

interface EnhancedCompanyCardProps {
  company: EnhancedCompanyData;
  onClick: () => void;
}

export function EnhancedCompanyCard({ company, onClick }: EnhancedCompanyCardProps) {
  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'Hold': return 'bg-gradient-to-r from-green-500 to-green-400 text-white border-green-400';
      case 'Reinvest': return 'bg-gradient-to-r from-blue-500 to-blue-400 text-white border-blue-400';
      case 'Exit': return 'bg-gradient-to-r from-red-500 to-red-400 text-white border-red-400';
      case 'Monitor': return 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-yellow-400';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white border-gray-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-red-500 to-red-400';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-green-500 to-green-400';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Card className="card-hover bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 shadow-medium hover:border-primary/50 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {company.companyName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {company.executive?.industryCategory || 'Technology'} • {company.executive?.fundingStage || 'Series A'}
            </p>
          </div>
          <Badge className={`ml-2 ${getRecommendationColor(company.recommendation)} shadow-soft`}>
            {company.recommendation || 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">Return Multiple</span>
            </div>
            <div className="text-lg font-bold text-success">
              {company.moic ? `${company.moic.toFixed(1)}x` : 'N/A'}
            </div>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              {(company.revenueGrowth || 0) >= 0 ? 
                <TrendingUp className="h-3 w-3 text-success" /> : 
                <TrendingDown className="h-3 w-3 text-destructive" />
              }
              <span className="text-xs text-muted-foreground">Growth Rate</span>
            </div>
            <div className={`text-lg font-bold ${(company.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercentage(company.revenueGrowth)}
            </div>
          </div>
        </div>

        {/* Risk and Management Scores */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-xs text-muted-foreground">Risk Score</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {company.riskAssessment?.overallRiskScore || 50}/100
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={company.riskAssessment?.overallRiskScore || 50} 
                className="h-2 bg-secondary/50"
              />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getRiskColor(company.riskAssessment?.overallRiskScore || 50)}`}
                style={{ width: `${company.riskAssessment?.overallRiskScore || 50}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-accent" />
                <span className="text-xs text-muted-foreground">Management Team</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {company.executive?.managementScore || 75}/100
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={company.executive?.managementScore || 75} 
                className="h-2 bg-secondary/50"
              />
              <div 
                className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                style={{ width: `${company.executive?.managementScore || 75}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Details */}
        <div className="pt-3 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{company.investmentDate || company.executive?.investmentDate || '2023'}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-24">
                {company.executive?.ceoName || 'CEO TBD'}
              </span>
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Investment: {formatCurrency(company.totalInvestment)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClick}
              className="h-6 px-2 text-xs bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:from-primary/20 hover:to-accent/20"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
