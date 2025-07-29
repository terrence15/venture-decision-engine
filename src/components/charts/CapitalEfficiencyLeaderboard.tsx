import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCapitalEfficiency, EfficiencyData } from '@/utils/chartData';
import { AnalyzedCompanyData } from '@/pages/Dashboard';

interface CapitalEfficiencyLeaderboardProps {
  companies: AnalyzedCompanyData[];
  onCompanySelect?: (company: AnalyzedCompanyData) => void;
}

export function CapitalEfficiencyLeaderboard({ companies, onCompanySelect }: CapitalEfficiencyLeaderboardProps) {
  const efficiencyData = calculateCapitalEfficiency(companies);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as EfficiencyData;
      return (
        <div className="bg-popover p-3 rounded-lg border shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">Burn Multiple: {data.burnMultiple.toFixed(2)}x</p>
          <p className="text-sm">Efficiency Score: {data.efficiency.toFixed(2)}</p>
          <p className="text-sm">Revenue: ${((data.data.revenue || data.data.arr || 0) / 1000000).toFixed(1)}M</p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (data && onCompanySelect) {
      onCompanySelect(data.data);
    }
  };

  if (efficiencyData.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Capital Efficiency Leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Top performers by capital efficiency
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No burn multiple data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Capital Efficiency Leaderboard</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top performers by capital efficiency (1 / burn multiple)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={efficiencyData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="efficiency" 
              onClick={handleClick}
              cursor="pointer"
            >
              {efficiencyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}