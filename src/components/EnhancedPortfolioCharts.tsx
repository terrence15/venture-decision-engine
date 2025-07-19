
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { EnhancedCompanyData } from '@/types/portfolio';

interface EnhancedPortfolioChartsProps {
  companies: EnhancedCompanyData[];
}

const chartConfig = {
  investment: { label: "Investment ($M)" },
  moic: { label: "MOIC" },
  recommendation: { label: "Recommendation" },
  company: { label: "Company" }
};

// Vibrant futuristic colors
const CHART_COLORS = {
  'Hold': '#10b981', // Neon Green
  'Reinvest': '#3b82f6', // Electric Blue  
  'Exit': '#ef4444', // Neon Red
  'Monitor': '#f59e0b', // Electric Orange
  'Pending': '#6b7280', // Muted Gray
  'primary': '#06b6d4', // Cyan
  'secondary': '#8b5cf6', // Purple
  'accent': '#f43f5e' // Pink
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6'];

export function EnhancedPortfolioCharts({ companies }: EnhancedPortfolioChartsProps) {
  // Recommendation distribution with proper colors
  const recommendationData = companies.reduce((acc, company) => {
    const rec = company.recommendation || 'Pending';
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(recommendationData).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[name as keyof typeof CHART_COLORS] || PIE_COLORS[index % PIE_COLORS.length]
  }));

  // Top investments with company names
  const topInvestments = companies
    .sort((a, b) => b.totalInvestment - a.totalInvestment)
    .slice(0, 8)
    .map(company => ({
      name: company.companyName.length > 12 ? 
            company.companyName.substring(0, 12) + '...' : 
            company.companyName,
      fullName: company.companyName,
      investment: company.totalInvestment / 1000000,
      moic: company.moic || 0,
      ceo: company.executive?.ceoName || 'N/A',
      fill: CHART_COLORS[company.recommendation as keyof typeof CHART_COLORS] || CHART_COLORS.primary
    }));

  // Investment vs Returns scatter plot
  const scatterData = companies
    .filter(c => c.moic !== null && c.moic !== undefined && c.totalInvestment > 0)
    .map(company => ({
      x: company.totalInvestment / 1000000,
      y: company.moic,
      name: company.companyName,
      ceo: company.executive?.ceoName || 'N/A',
      recommendation: company.recommendation || 'Pending',
      fill: CHART_COLORS[company.recommendation as keyof typeof CHART_COLORS] || CHART_COLORS.primary
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-strong">
          <p className="font-semibold text-foreground">{data.fullName || data.name}</p>
          {data.ceo && <p className="text-sm text-muted-foreground">CEO: {data.ceo}</p>}
          <p className="text-sm text-primary">
            Investment: ${typeof data.investment === 'number' ? data.investment.toFixed(1) : data.x?.toFixed(1)}M
          </p>
          {data.moic && <p className="text-sm text-accent">MOIC: {data.moic.toFixed(1)}x</p>}
          {data.y && <p className="text-sm text-accent">MOIC: {data.y.toFixed(1)}x</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recommendation Distribution */}
      <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Recommendation Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} strokeWidth={2} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-strong">
                          <p className="font-semibold text-foreground">{payload[0].name}</p>
                          <p className="text-sm text-primary">Count: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Investments */}
      <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <BarChart3 className="h-4 w-4 text-primary" />
            Top Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topInvestments} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                />
                <YAxis 
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  width={40}
                  label={{ value: '$M', angle: 0, position: 'insideTopLeft', style: { textAnchor: 'middle' } }}
                />
                <Bar dataKey="investment" radius={[2, 2, 0, 0]} stroke="hsl(var(--border))" strokeWidth={1} />
                <ChartTooltip content={<CustomTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Investment vs Returns */}
      <Card className="shadow-strong glow-effect bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base gradient-text">
            <TrendingUp className="h-4 w-4 text-primary" />
            Investment vs Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={scatterData} margin={{ top: 10, right: 10, left: 40, bottom: 30 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Investment"
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Investment ($M)', position: 'insideBottom', offset: -5, style: { fontSize: '10px' } }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="MOIC"
                  fontSize={9}
                  stroke="hsl(var(--muted-foreground))"
                  width={35}
                  label={{ value: 'MOIC', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <Scatter fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth={1} />
                <ChartTooltip content={<CustomTooltip />} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
