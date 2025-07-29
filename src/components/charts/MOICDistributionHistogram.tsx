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
        <div className="bg-popover p-3 rounded-lg border shadow-lg">
          <p className="font-semibold">MOIC Range: {label}</p>
          <p className="text-sm">Companies: {bin.count}</p>
          <p className="text-sm">Click to filter table</p>
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">MOIC Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          How companies cluster across return multiples
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="range" 
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Number of Companies', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              onClick={handleClick}
              cursor="pointer"
            >
              {bins.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}