
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { EnhancedCompanyData } from '@/types/portfolio';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';

interface EnhancedPortfolioChartsProps {
  companies: EnhancedCompanyData[];
}

// Fixed color palette for recommendations
const RECOMMENDATION_COLORS = {
  'Reinvest': '#10b981',
  'Hold': '#3b82f6', 
  'Exit': '#ef4444',
  'Monitor': '#f59e0b',
  'Double Down': '#8b5cf6',
  'Decline': '#6b7280',
  'Pending': '#64748b'
};

export function EnhancedPortfolioCharts({ companies }: EnhancedPortfolioChartsProps) {
  // Recommendation distribution data with proper colors
  const recommendationCounts = companies.reduce((acc, company) => {
    const rec = company.recommendation || 'Pending';
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(recommendationCounts).map(([name, count]) => ({
    name,
    count,
    fill: RECOMMENDATION_COLORS[name as keyof typeof RECOMMENDATION_COLORS] || RECOMMENDATION_COLORS.Pending
  }));

  // Top investments data
  const topInvestments = companies
    .sort((a, b) => b.totalInvestment - a.totalInvestment)
    .slice(0, 5)
    .map(company => ({
      name: company.companyName.length > 8 ? 
            company.companyName.substring(0, 8) + '...' : 
            company.companyName,
      investment: Number((company.totalInvestment / 1000000).toFixed(1))
    }));

  // Investment vs Returns scatter data with company names
  const scatterData = companies
    .filter(company => company.moic && company.totalInvestment)
    .map(company => ({
      x: Number((company.totalInvestment / 1000000).toFixed(1)),
      y: company.moic,
      companyName: company.companyName,
      name: company.companyName // Add name for tooltip
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
          <p className="font-medium text-foreground text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'investment' ? 'M' : entry.name === 'y' ? 'x' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
          <p className="font-medium text-foreground text-sm">{data.companyName}</p>
          <p className="text-xs text-muted-foreground">
            Investment: ${data.x}M
          </p>
          <p className="text-xs text-muted-foreground">
            MOIC: {data.y}x
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Recommendation Distribution */}
      <Card className="shadow-elegant glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Recommendation Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-48 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="95%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={60}
                  dataKey="count"
                  label={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '10px', 
                    color: 'hsl(var(--foreground))',
                    paddingTop: '8px'
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Investments */}
      <Card className="shadow-elegant glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <BarChart3 className="h-4 w-4 text-primary" />
            Top Investments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-48">
            <ResponsiveContainer width="95%" height="95%">
              <BarChart 
                data={topInvestments} 
                margin={{ top: 10, right: 5, left: 5, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={35}
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                />
                <YAxis 
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  width={25}
                  label={{ value: '$M', angle: 0, position: 'insideTopLeft', style: { fontSize: '8px' } }}
                />
                <Bar 
                  dataKey="investment" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]} 
                  stroke="hsl(var(--border))" 
                  strokeWidth={0.5} 
                />
                <Tooltip content={<CustomTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Investment vs Returns */}
      <Card className="shadow-elegant glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <TrendingUp className="h-4 w-4 text-primary" />
            Investment vs Returns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-48">
            <ResponsiveContainer width="95%" height="95%">
              <ScatterChart 
                data={scatterData} 
                margin={{ top: 10, right: 5, left: 15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Investment"
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Investment ($M)', position: 'insideBottom', offset: -5, style: { fontSize: '8px' } }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="MOIC"
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  width={20}
                  label={{ value: 'MOIC', angle: -90, position: 'insideLeft', style: { fontSize: '8px' } }}
                />
                <Scatter 
                  fill="hsl(var(--accent))" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={1}
                  r={4}
                />
                <Tooltip content={<ScatterTooltip />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
