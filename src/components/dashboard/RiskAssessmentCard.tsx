import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, Shield } from "lucide-react";
import { useState } from "react";

interface RiskAssessmentProps {
  riskAssessment: {
    summary: string;
    majorRisks: Array<{
      risk: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      impact: string;
    }>;
  };
  keyRisks: string[];
}

export function RiskAssessmentCard({ riskAssessment, keyRisks }: RiskAssessmentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const criticalCount = riskAssessment.majorRisks.filter(r => r.severity === 'critical').length;
  const highCount = riskAssessment.majorRisks.filter(r => r.severity === 'high').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Assessment
            {(criticalCount > 0 || highCount > 0) && (
              <Badge variant="destructive">
                {criticalCount + highCount} High Risk{criticalCount + highCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{riskAssessment.summary}</p>

        <div className="space-y-2">
          {riskAssessment.majorRisks.slice(0, 3).map((risk, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className={`p-1 rounded ${getSeverityColor(risk.severity)}`}>
                {getSeverityIcon(risk.severity)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{risk.risk}</span>
                  <Badge className={getSeverityColor(risk.severity)} variant="outline">
                    {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{risk.impact}</p>
              </div>
            </div>
          ))}
        </div>

        {(riskAssessment.majorRisks.length > 3 || keyRisks.length > 0) && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              Show {riskAssessment.majorRisks.length > 3 ? 'additional' : 'detailed'} risks
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {riskAssessment.majorRisks.slice(3).map((risk, index) => (
                <div key={index + 3} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`p-1 rounded ${getSeverityColor(risk.severity)}`}>
                    {getSeverityIcon(risk.severity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{risk.risk}</span>
                      <Badge className={getSeverityColor(risk.severity)} variant="outline">
                        {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{risk.impact}</p>
                  </div>
                </div>
              ))}
              
              {keyRisks.length > 0 && (
                <div className="mt-4 p-3 border rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Additional Risk Factors:</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {keyRisks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}