import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, ChevronDown, Calculator, BarChart3 } from "lucide-react";
import { useState } from "react";

interface ExitScenarioProps {
  exitScenario: {
    summary: string;
    detailedCalculation: string;
    timeSeriesData: string;
    confidence: number;
  };
  projectedExitValue: string;
}

export function ExitScenarioCard({ exitScenario, projectedExitValue }: ExitScenarioProps) {
  const [showDetail, setShowDetail] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    if (confidence >= 0.6) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Exit Scenario
          </CardTitle>
          <Badge className={getConfidenceColor(exitScenario.confidence)}>
            {getConfidenceLabel(exitScenario.confidence)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary View */}
        <div className="space-y-3">
          <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Projected Exit Value</span>
            </div>
            <p className="text-sm">{exitScenario.summary}</p>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Growth Trajectory</span>
            </div>
            <p className="text-sm text-muted-foreground">{exitScenario.timeSeriesData}</p>
          </div>
        </div>

        {/* Toggle for detailed view */}
        <Collapsible open={showDetail} onOpenChange={setShowDetail}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full">
            <Calculator className="w-4 h-4" />
            <ChevronDown className={`w-4 h-4 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
            Show detailed calculations and methodology
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/20">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Detailed Exit Value Calculation
                </h5>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>{exitScenario.detailedCalculation}</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <h5 className="text-sm font-medium mb-3">Complete Analysis</h5>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>{projectedExitValue}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${exitScenario.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(exitScenario.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}