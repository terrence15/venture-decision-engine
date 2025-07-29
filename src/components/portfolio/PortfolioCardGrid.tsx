import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PortfolioCard } from './PortfolioCard';
import { PortfolioCardExpanded } from './PortfolioCardExpanded';
import { AnalyzedCompanyData } from '@/pages/Dashboard';
import { 
  LayoutGrid, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  TrendingUp,
  Building2,
  DollarSign,
  Clock
} from 'lucide-react';

interface PortfolioCardGridProps {
  companies: AnalyzedCompanyData[];
  onCompanySelect?: (company: AnalyzedCompanyData) => void;
}

type SortOption = 'name' | 'moic' | 'investment' | 'runway' | 'confidence';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'healthy' | 'moderate' | 'high-risk' | 'requesting-capital';

export function PortfolioCardGrid({ companies, onCompanySelect }: PortfolioCardGridProps) {
  const [selectedCompany, setSelectedCompany] = useState<AnalyzedCompanyData | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<AnalyzedCompanyData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(company =>
        company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(company => {
        switch (filterBy) {
          case 'healthy':
            return company.confidence && company.confidence >= 4;
          case 'moderate':
            return company.confidence && company.confidence >= 3 && company.confidence < 4;
          case 'high-risk':
            return company.confidence && company.confidence < 3;
          case 'requesting-capital':
            return company.additionalInvestmentRequested && company.additionalInvestmentRequested > 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
          break;
        case 'moic':
          aValue = a.moic || 0;
          bValue = b.moic || 0;
          break;
        case 'investment':
          aValue = a.totalInvestment || 0;
          bValue = b.totalInvestment || 0;
          break;
        case 'runway':
          aValue = a.runway || 0;
          bValue = b.runway || 0;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [companies, searchQuery, sortBy, sortDirection, filterBy]);

  const handleCompanyExpand = (company: AnalyzedCompanyData) => {
    setExpandedCompany(company);
    onCompanySelect?.(company);
  };

  const handleSortToggle = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  // Get filter counts
  const filterCounts = useMemo(() => {
    return {
      all: companies.length,
      healthy: companies.filter(c => c.confidence && c.confidence >= 4).length,
      moderate: companies.filter(c => c.confidence && c.confidence >= 3 && c.confidence < 4).length,
      'high-risk': companies.filter(c => c.confidence && c.confidence < 3).length,
      'requesting-capital': companies.filter(c => c.additionalInvestmentRequested && c.additionalInvestmentRequested > 0).length,
    };
  }, [companies]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-5 w-5 text-accent" />
              <CardTitle className="font-orbitron text-xl tracking-wider">
                PORTFOLIO CARD VIEW
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-accent/50 text-accent">
              {filteredAndSortedCompanies.length} of {companies.length} companies
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies or industries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 console-input"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40 console-input">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass-card border-accent/30">
                  <SelectItem value="name">Company Name</SelectItem>
                  <SelectItem value="moic">MOIC</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="runway">Runway</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="border-accent/30 hover:border-accent"
              >
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {Object.entries({
              all: { label: 'All', icon: Building2 },
              healthy: { label: 'Healthy', icon: TrendingUp },
              moderate: { label: 'Moderate Risk', icon: Clock },
              'high-risk': { label: 'High Risk', icon: Filter },
              'requesting-capital': { label: 'Requesting Capital', icon: DollarSign }
            }).map(([key, { label, icon: Icon }]) => (
              <Button
                key={key}
                variant={filterBy === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy(key as FilterOption)}
                className={`flex items-center gap-2 ${
                  filterBy === key 
                    ? 'bg-accent text-accent-foreground' 
                    : 'border-accent/30 hover:border-accent'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filterCounts[key as keyof typeof filterCounts]}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {filteredAndSortedCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedCompanies.map((company) => (
            <PortfolioCard
              key={company.id}
              company={company}
              onExpand={handleCompanyExpand}
            />
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No companies found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload a portfolio file to get started'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Company Modal */}
      <PortfolioCardExpanded
        company={expandedCompany}
        isOpen={!!expandedCompany}
        onClose={() => setExpandedCompany(null)}
      />
    </div>
  );
}