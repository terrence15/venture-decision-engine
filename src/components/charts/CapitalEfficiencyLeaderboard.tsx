import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCapitalEfficiency, EfficiencyData } from '@/utils/chartData';
import { AnalyzedCompanyData } from '@/pages/Dashboard';

interface CapitalEfficiencyLeaderboardProps {
  companies: AnalyzedCompanyData[];
  onCompanySelect?: (company: AnalyzedCompanyData) => void;
}

export function CapitalEfficiencyLeaderboard({ companies, onCompanySelect }: CapitalEfficiencyLeaderboardProps) {
  const efficiencyData = useMemo(() => calculateCapitalEfficiency(companies), [companies]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as EfficiencyData;
      return (
        <div className="hud-tooltip p-3 rounded-lg font-space-grotesk">
          <p className="font-orbitron font-bold text-accent text-xs uppercase tracking-wider">{label}</p>
          <p className="text-sm text-foreground">Burn Multiple: <span className="text-accent">{data.burnMultiple.toFixed(2)}x</span></p>
          <p className="text-sm text-foreground">Efficiency Score: <span className="text-accent">{data.efficiency.toFixed(2)}</span></p>
          <p className="text-sm text-foreground">Revenue: <span className="text-accent">${((data.data.revenue || data.data.arr || 0) / 1000000).toFixed(1)}M</span></p>
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
      <Card className="shadow-glow relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-orbitron text-accent">CAPITAL EFFICIENCY LEADERBOARD</CardTitle>
          <p className="text-sm text-muted-foreground font-space-grotesk">
            Top performers by capital efficiency
          </p>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-background/50 to-background/80">
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="font-space-grotesk">No burn multiple data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-glow relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron text-accent">CAPITAL EFFICIENCY LEADERBOARD</CardTitle>
        <p className="text-sm text-muted-foreground font-space-grotesk">
          Top performers by capital efficiency (1 / burn multiple)
        </p>
      </CardHeader>
      <CardContent className="bg-gradient-to-br from-background/50 to-background/80">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={efficiencyData} layout="horizontal">
            <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--accent) / 0.2)" />
            <XAxis 
              type="number" 
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="efficiency" 
              onClick={handleClick}
              cursor="pointer"
            >
              {efficiencyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--accent))" strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}