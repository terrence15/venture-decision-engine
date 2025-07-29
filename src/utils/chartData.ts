import { AnalyzedCompanyData } from '@/pages/Dashboard';

export interface ChartDataPoint {
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  data: AnalyzedCompanyData;
}

export interface MOICBin {
  range: string;
  count: number;
  color: string;
  companies: AnalyzedCompanyData[];
}

export interface EfficiencyData {
  name: string;
  efficiency: number;
  burnMultiple: number;
  color: string;
  data: AnalyzedCompanyData;
}

// Calculate risk-adjusted MOIC by weighting with confidence
export function calculateRiskAdjustedMOIC(moic: number, confidence: number): number {
  if (!moic || !confidence) return 0;
  // Confidence scale 1-5, weight by (confidence/5)
  return moic * (confidence / 5);
}

// Determine industry alignment based on strategic fit
export function determineIndustryAlignment(company: AnalyzedCompanyData): string {
  const recommendation = company.recommendation?.toLowerCase() || '';
  const confidence = company.confidence || 0;
  
  if (confidence >= 4 && (recommendation.includes('strong') || recommendation.includes('recommend'))) {
    return 'hsl(var(--success))'; // Green for aligned
  } else if (confidence <= 2 || recommendation.includes('divest') || recommendation.includes('exit')) {
    return 'hsl(var(--destructive))'; // Red for off-thesis
  }
  return 'hsl(var(--warning))'; // Yellow for neutral
}

// Process data for bubble chart
export function processPortfolioExposureData(companies: AnalyzedCompanyData[]): ChartDataPoint[] {
  return companies
    .filter(company => company.moic && company.confidence && company.totalInvestment)
    .map(company => ({
      name: company.companyName,
      x: calculateRiskAdjustedMOIC(company.moic!, company.confidence!),
      y: company.confidence!,
      size: (company.totalInvestment! + (company.additionalInvestmentRequested || 0)) / 1000000, // Convert to millions
      color: determineIndustryAlignment(company),
      data: company
    }));
}

// Categorize companies by MOIC bins
export function categorizeByMOICBins(companies: AnalyzedCompanyData[]): MOICBin[] {
  const bins = [
    { range: '<0.5x', min: 0, max: 0.5, count: 0, color: 'hsl(var(--destructive))', companies: [] as AnalyzedCompanyData[] },
    { range: '0.5-1x', min: 0.5, max: 1, count: 0, color: 'hsl(var(--destructive-foreground))', companies: [] as AnalyzedCompanyData[] },
    { range: '1-2x', min: 1, max: 2, count: 0, color: 'hsl(var(--warning))', companies: [] as AnalyzedCompanyData[] },
    { range: '2-3x', min: 2, max: 3, count: 0, color: 'hsl(var(--primary))', companies: [] as AnalyzedCompanyData[] },
    { range: '3-5x', min: 3, max: 5, count: 0, color: 'hsl(var(--success))', companies: [] as AnalyzedCompanyData[] },
    { range: '5x+', min: 5, max: Infinity, count: 0, color: 'hsl(var(--success-foreground))', companies: [] as AnalyzedCompanyData[] }
  ];

  companies
    .filter(company => company.moic !== null && company.moic !== undefined)
    .forEach(company => {
      const moic = company.moic!;
      const bin = bins.find(b => moic >= b.min && moic < b.max);
      if (bin) {
        bin.count++;
        bin.companies.push(company);
      }
    });

  return bins;
}

// Calculate capital efficiency metrics
export function calculateCapitalEfficiency(companies: AnalyzedCompanyData[]): EfficiencyData[] {
  return companies
    .filter(company => company.burnMultiple && company.totalInvestment)
    .map(company => {
      const efficiency = company.burnMultiple! > 0 ? 1 / company.burnMultiple! : 0;
      return {
        name: company.companyName,
        efficiency,
        burnMultiple: company.burnMultiple!,
        color: company.burnMultiple! <= 1.5 ? 'hsl(var(--success))' : 
               company.burnMultiple! <= 3 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
        data: company
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 10); // Top 10 most efficient
}