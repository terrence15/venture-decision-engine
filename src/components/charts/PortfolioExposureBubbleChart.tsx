import { Scatter, ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processPortfolioExposureData, ChartDataPoint } from '@/utils/chartData';
import { AnalyzedCompanyData } from '@/pages/Dashboard';

interface PortfolioExposureBubbleChartProps {
  companies: AnalyzedCompanyData[];
  onCompanySelect?: (company: AnalyzedCompanyData) => void;
}

export function PortfolioExposureBubbleChart({ companies, onCompanySelect }: PortfolioExposureBubbleChartProps) {
  const data = processPortfolioExposureData(companies);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="hud-tooltip p-3 rounded-lg font-space-grotesk">
          <p className="font-orbitron font-bold text-accent text-xs uppercase tracking-wider">{data.name}</p>
          <p className="text-sm text-foreground">Risk-Adjusted MOIC: <span className="text-accent">{data.x.toFixed(2)}x</span></p>
          <p className="text-sm text-foreground">Confidence: <span className="text-accent">{data.y}/5</span></p>
          <p className="text-sm text-foreground">Capital Exposure: <span className="text-accent">${data.size.toFixed(1)}M</span></p>
          <p className="text-sm text-foreground">Recommendation: <span className="text-accent">{data.data.recommendation || 'Pending'}</span></p>
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

  return (
    <Card className="shadow-glow relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron text-accent">PORTFOLIO EXPOSURE VS RISK</CardTitle>
        <p className="text-sm text-muted-foreground font-space-grotesk">
          Capital at risk vs potential return. Bubble size = total exposure.
        </p>
      </CardHeader>
      <CardContent className="bg-gradient-to-br from-background/50 to-background/80">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--accent) / 0.2)" />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
              label={{ value: 'Risk-Adjusted MOIC', position: 'insideBottom', offset: -5, style: { fill: 'hsl(var(--accent))' } }}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              domain={[0, 5]}
              tick={{ fill: 'hsl(var(--accent))', fontSize: 12 }}
              label={{ value: 'Confidence Score', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--accent))' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              dataKey="size" 
              onClick={handleClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--accent))" strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}