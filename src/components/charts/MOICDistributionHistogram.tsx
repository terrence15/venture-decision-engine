import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categorizeByMOICBins, MOICBin } from '@/utils/chartData';
import { AnalyzedCompanyData } from '@/pages/Dashboard';

interface MOICDistributionHistogramProps {
  companies: AnalyzedCompanyData[];
  onBinSelect?: (companies: AnalyzedCompanyData[]) => void;
}

export function MOICDistributionHistogram({ companies, onBinSelect }: MOICDistributionHistogramProps) {
  const bins = categorizeByMOICBins(companies);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const bin = payload[0].payload as MOICBin;
      return (
        <div className="hud-tooltip p-3 rounded-lg font-space-grotesk">
          <p className="font-orbitron font-bold text-accent text-xs uppercase tracking-wider">MOIC Range: {label}</p>
          <p className="text-sm text-foreground">Companies: <span className="text-accent">{bin.count}</span></p>
          <p className="text-xs text-muted-foreground">Click to filter table</p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (data && onBinSelect) {
      onBinSelect(data.companies);
    }
  };

  return (
    <Card className="shadow-glow relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron text-accent">MOIC DISTRIBUTION</CardTitle>
        <p className="text-sm text-muted-foreground font-space-grotesk">
          How companies cluster across return multiples
        </p>
      </CardHeader>
      <CardContent className="bg-gradient-to-br from-background/50 to-background/80">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--accent) / 0.2)" />
            <XAxis 
              dataKey="range" 
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
              label={{ value: 'Number of Companies', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--accent))' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              onClick={handleClick}
              cursor="pointer"
            >
              {bins.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--accent))" strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}