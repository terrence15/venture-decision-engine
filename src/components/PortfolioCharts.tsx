
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface CompanyData {
  id: string;
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  externalSources?: string;
  insufficientData?: boolean;
}

interface PortfolioChartsProps {
  companies: CompanyData[];
}

const chartConfig = {
  investment: {
    label: "Investment",
  },
  moic: {
    label: "MOIC",
  },
  recommendation: {
    label: "Recommendation",
  },
};

export function PortfolioCharts({ companies }: PortfolioChartsProps) {
  // Prepare recommendation distribution data
  const recommendationData = companies.reduce((acc, company) => {
    const rec = company.recommendation || 'Pending';
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(recommendationData).map(([name, value]) => ({
    name,
    value,
    fill: name === 'Hold' ? '#10b981' : 
          name === 'Reinvest' ? '#3b82f6' : 
          name === 'Exit' ? '#ef4444' : 
          name === 'Monitor' ? '#f59e0b' : '#6b7280'
  }));

  // Prepare investment vs MOIC data
  const scatterData = companies
    .filter(c => c.moic !== null && c.moic !== undefined)
    .map(company => ({
      x: company.totalInvestment / 1000000, // Convert to millions
      y: company.moic,
      name: company.companyName,
      recommendation: company.recommendation
    }));

  // Prepare top investments bar chart
  const topInvestments = companies
    .sort((a, b) => b.totalInvestment - a.totalInvestment)
    .slice(0, 8)
    .map(company => ({
      name: company.companyName.length > 15 ? 
            company.companyName.substring(0, 15) + '...' : 
            company.companyName,
      investment: company.totalInvestment / 1000000,
      moic: company.moic || 0,
      fill: company.recommendation === 'Hold' ? '#10b981' : 
            company.recommendation === 'Reinvest' ? '#3b82f6' : 
            company.recommendation === 'Exit' ? '#ef4444' : '#6b7280'
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recommendation Distribution */}
      <Card className="shadow-medium">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4" />
            Recommendation Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Investments */}
      <Card className="shadow-medium">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Top Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={topInvestments} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                fontSize={10}
              />
              <Bar dataKey="investment" radius={2} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => [`$${value.toFixed(1)}M`, 'Investment']}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Investment vs Returns */}
      <Card className="shadow-medium">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Investment vs Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ScatterChart data={scatterData}>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Investment ($M)"
                fontSize={10}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="MOIC"
                fontSize={10}
              />
              <Scatter fill="#3b82f6" />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any, name: string) => [
                  name === 'x' ? `$${value.toFixed(1)}M` : `${value.toFixed(1)}x`,
                  name === 'x' ? 'Investment' : 'MOIC'
                ]}
              />
            </ScatterChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
