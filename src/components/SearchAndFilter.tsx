
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  selectedFilters?: {
    recommendation: string[];
    confidence: string[];
    investmentRange: string;
  };
  onFilterChange?: (filters: any) => void;
  onClearFilters?: () => void;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  placeholder = "Search companies...",
  selectedFilters,
  onFilterChange,
  onClearFilters
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const recommendationOptions = ['Hold', 'Reinvest', 'Exit', 'Monitor'];
  const confidenceOptions = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const investmentRanges = [
    'Under $1M',
    '$1M - $5M',
    '$5M - $10M',
    '$10M - $50M',
    'Over $50M'
  ];

  const toggleRecommendationFilter = (recommendation: string) => {
    const current = selectedFilters.recommendation;
    const updated = current.includes(recommendation)
      ? current.filter(r => r !== recommendation)
      : [...current, recommendation];
    
    onFilterChange({
      ...selectedFilters,
      recommendation: updated
    });
  };

  const toggleConfidenceFilter = (confidence: string) => {
    const current = selectedFilters.confidence;
    const updated = current.includes(confidence)
      ? current.filter(c => c !== confidence)
      : [...current, confidence];
    
    onFilterChange({
      ...selectedFilters,
      confidence: updated
    });
  };

  const hasActiveFilters = 
    selectedFilters.recommendation.length > 0 ||
    selectedFilters.confidence.length > 0 ||
    selectedFilters.investmentRange !== '';

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                  {selectedFilters.recommendation.length + selectedFilters.confidence.length + (selectedFilters.investmentRange ? 1 : 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={onClearFilters} size="sm">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Recommendation</label>
                <div className="flex flex-wrap gap-2">
                  {recommendationOptions.map((rec) => (
                    <Badge
                      key={rec}
                      variant={selectedFilters.recommendation.includes(rec) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleRecommendationFilter(rec)}
                    >
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confidence Level</label>
                <div className="flex flex-wrap gap-2">
                  {confidenceOptions.map((conf) => (
                    <Badge
                      key={conf}
                      variant={selectedFilters.confidence.includes(conf) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleConfidenceFilter(conf)}
                    >
                      {conf}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Investment Range</label>
                <Select
                  value={selectedFilters.investmentRange}
                  onValueChange={(value) => onFilterChange({
                    ...selectedFilters,
                    investmentRange: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Ranges</SelectItem>
                    {investmentRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
