import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Clock } from "lucide-react";

interface FinancialHealthProps {
  financialHealth: {
    summary: string;
    burnMultiple: number;
    arrGrowth: string;
    healthScore: number;
  };
}

export function FinancialHealthCard({ financialHealth }: FinancialHealthProps) {
  const getHealthColor = (score: number) => {
    if (score >= 4) return { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Excellent' };
    if (score >= 3) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Good' };
    if (score === 2) return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Poor' };
  };

  const getBurnMultipleColor = (multiple: number) => {
    if (multiple <= 1.5) return 'text-emerald-600';
    if (multiple <= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const healthInfo = getHealthColor(financialHealth.healthScore);
  const healthPercentage = (financialHealth.healthScore / 5) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Financial Health
          <Badge className={`${healthInfo.bg} text-white`}>
            {healthInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Health Score</span>
            <span className={`font-semibold ${healthInfo.text}`}>
              {financialHealth.healthScore}/5
            </span>
          </div>
          <Progress value={healthPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Burn Multiple</span>
            </div>
            <div className={`text-lg font-bold ${getBurnMultipleColor(financialHealth.burnMultiple)}`}>
              {financialHealth.burnMultiple.toFixed(1)}x
            </div>
            {financialHealth.burnMultiple > 2.5 && (
              <Badge variant="destructive" className="text-xs">
                High Burn Risk
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Growth Trajectory</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {financialHealth.arrGrowth}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">{financialHealth.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}