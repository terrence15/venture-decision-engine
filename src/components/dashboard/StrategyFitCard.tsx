import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Edit3, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface StrategyFitProps {
  strategyFit: {
    score: number;
    justification: string;
    editableSuggestions: string[];
  };
  fundStrategyAlignment: string;
}

export function StrategyFitCard({ strategyFit, fundStrategyAlignment }: StrategyFitProps) {
  const [editingSuggestions, setEditingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(strategyFit.editableSuggestions);

  const getAlignmentColor = (score: number) => {
    if (score >= 4) return { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Strong Fit' };
    if (score >= 3) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Good Fit' };
    if (score === 2) return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Moderate Fit' };
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Poor Fit' };
  };

  const alignmentInfo = getAlignmentColor(strategyFit.score);
  const alignmentPercentage = (strategyFit.score / 5) * 100;

  const handleSuggestionChange = (index: number, value: string) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index] = value;
    setSuggestions(newSuggestions);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fund Strategy Alignment
          </CardTitle>
          <Badge className={`${alignmentInfo.bg} text-white`}>
            {alignmentInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Alignment Score</span>
            <span className={`font-semibold ${alignmentInfo.text}`}>
              {strategyFit.score}/5
            </span>
          </div>
          <Progress value={alignmentPercentage} className="h-2" />
        </div>

        <div className="p-3 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Investment Thesis Alignment</h5>
          <p className="text-sm text-muted-foreground">{strategyFit.justification}</p>
        </div>

        <div className="p-3 border rounded-lg">
          <h5 className="text-sm font-medium mb-2">Detailed Analysis</h5>
          <p className="text-sm text-muted-foreground">{fundStrategyAlignment}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Analyst Recommendations
            </h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSuggestions(!editingSuggestions)}
              className="text-xs"
            >
              {editingSuggestions ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {editingSuggestions ? (
                  <input
                    type="text"
                    value={suggestion}
                    onChange={(e) => handleSuggestionChange(index, e.target.value)}
                    className="flex-1 text-sm bg-background border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">{suggestion}</span>
                )}
              </div>
            ))}
          </div>

          {editingSuggestions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuggestions([...suggestions, "New recommendation..."])}
              className="text-xs text-muted-foreground"
            >
              + Add recommendation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}