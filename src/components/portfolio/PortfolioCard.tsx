import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnalyzedCompanyData } from '@/pages/Dashboard';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Expand,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioCardProps {
  company: AnalyzedCompanyData;
  onExpand: (company: AnalyzedCompanyData) => void;
}

export function PortfolioCard({ company, onExpand }: PortfolioCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate health status based on confidence and MOIC
  const getHealthStatus = () => {
    if (!company.confidence) return { status: 'unknown', color: 'text-muted-foreground', icon: HelpCircle };
    
    if (company.confidence >= 4) return { status: 'healthy', color: 'text-success', icon: CheckCircle };
    if (company.confidence >= 3) return { status: 'moderate', color: 'text-warning', icon: AlertCircle };
    return { status: 'high-risk', color: 'text-destructive', icon: AlertTriangle };
  };

  // Get stage from valuation or default
  const getStage = () => {
    const valuation = company.preMoneyValuation || company.postMoneyValuation || 0;
    if (valuation < 5000000) return 'Seed';
    if (valuation < 25000000) return 'Series A';
    if (valuation < 100000000) return 'Series B';
    return 'Series C+';
  };

  // Format currency values
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format runway
  const formatRunway = (months: number | null | undefined) => {
    if (!months) return 'N/A';
    return `${months}mo`;
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "glass-card transition-all duration-300 cursor-pointer relative overflow-hidden group",
          isHovered && "shadow-glow"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onExpand(company)}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-orbitron font-bold text-lg text-foreground mb-2 tracking-wider">
                {company.companyName}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs border-accent/50 text-accent">
                  {getStage()}
                </Badge>
                <Badge variant="outline" className="text-xs border-purple/50 text-purple">
                  {company.industry || 'Tech'}
                </Badge>
              </div>
            </div>
            
            {/* Health Status Indicator */}
            <div className="flex items-center gap-2">
              <HealthIcon className={cn("h-5 w-5", healthStatus.color)} />
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(company);
                }}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Strip */}
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground font-space-grotesk">ARR/Revenue</p>
                    <p className="font-bold text-foreground">
                      {formatCurrency(company.arr || company.revenue)}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="hud-tooltip">
                <p>Annual Recurring Revenue or Total Revenue</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-xs text-muted-foreground font-space-grotesk">Burn Multiple</p>
                    <p className="font-bold text-foreground">
                      {company.burnMultiple ? `${company.burnMultiple.toFixed(1)}x` : 'N/A'}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="hud-tooltip">
                <p>Capital burn efficiency metric</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Building2 className="h-4 w-4 text-purple" />
                  <div>
                    <p className="text-xs text-muted-foreground font-space-grotesk">Equity Stake</p>
                    <p className="font-bold text-foreground">
                      {formatPercentage(company.equityStake)}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="hud-tooltip">
                <p>Your ownership percentage</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Clock className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-xs text-muted-foreground font-space-grotesk">Runway</p>
                    <p className="font-bold text-foreground">
                      {formatRunway(company.runway)}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="hud-tooltip">
                <p>Months of runway remaining</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* AI Summary */}
          {company.riskAdjustedMonetizationSummary && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-accent/10 to-purple/10 border border-accent/20">
              <p className="text-sm text-foreground font-space-grotesk leading-relaxed">
                {company.riskAdjustedMonetizationSummary}
              </p>
              {company.confidence && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">AI Confidence</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < company.confidence! 
                            ? "bg-accent shadow-[0_0_4px_hsl(var(--accent))]" 
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Investment Request Indicator */}
          {company.additionalInvestmentRequested && company.additionalInvestmentRequested > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Requesting {formatCurrency(company.additionalInvestmentRequested)}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </TooltipProvider>
  );
}