import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ExecutiveSummaryProps {
  executiveSummary: {
    outcome: string;
    keyMetrics: {
      irr: string;
      moic: string;
      cashMultiple: string;
      runway: string;
      valuationDelta: string;
    };
    visualCues: string[];
  };
  recommendation: string;
  confidence: number;
}

export function ExecutiveSummaryCard({ executiveSummary, recommendation, confidence }: ExecutiveSummaryProps) {
  const getRecommendationColor = (rec: string) => {
    const lower = rec.toLowerCase();
    if (lower.includes('strong buy') || lower.includes('buy')) return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    if (lower.includes('hold')) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    if (lower.includes('sell')) return 'bg-red-500/10 text-red-700 border-red-200';
    return 'bg-muted text-muted-foreground';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderVisualCue = (cue: string, index: number) => {
    if (cue.includes('⚠')) {
      return (
        <Badge key={index} variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {cue.replace(/\[⚠.*?\]/, '').trim()}
        </Badge>
      );
    }
    if (cue.includes('🚩')) {
      return (
        <Badge key={index} variant="destructive" className="bg-red-500/10 text-red-700 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {cue.replace(/\[🚩.*?\]/, '').trim()}
        </Badge>
      );
    }
    if (cue.includes('✅')) {
      return (
        <Badge key={index} variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {cue.replace(/\[✅.*?\]/, '').trim()}
        </Badge>
      );
    }
    return (
      <Badge key={index} variant="outline">
        {cue}
      </Badge>
    );
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Executive Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getRecommendationColor(recommendation)}>
              {recommendation.split('.')[0]}
            </Badge>
            <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
              {confidence}/10 Confidence
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{executiveSummary.outcome}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">IRR</div>
            <div className="font-semibold">{executiveSummary.keyMetrics.irr}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">MOIC</div>
            <div className="font-semibold">{executiveSummary.keyMetrics.moic}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Multiple</div>
            <div className="font-semibold">{executiveSummary.keyMetrics.cashMultiple}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Runway</div>
            <div className="font-semibold">{executiveSummary.keyMetrics.runway}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Val/ARR</div>
            <div className="font-semibold">{executiveSummary.keyMetrics.valuationDelta}</div>
          </div>
        </div>

        {executiveSummary.visualCues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {executiveSummary.visualCues.map(renderVisualCue)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}