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
        <div className="bg-popover p-3 rounded-lg border shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Risk-Adjusted MOIC: {data.x.toFixed(2)}x</p>
          <p className="text-sm">Confidence: {data.y}/5</p>
          <p className="text-sm">Capital Exposure: ${data.size.toFixed(1)}M</p>
          <p className="text-sm">Recommendation: {data.data.recommendation || 'Pending'}</p>
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Portfolio Exposure vs Risk</CardTitle>
        <p className="text-sm text-muted-foreground">
          Capital at risk vs potential return. Bubble size = total exposure.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Risk-Adjusted MOIC', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              domain={[0, 5]}
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Confidence Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              dataKey="size" 
              onClick={handleClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}