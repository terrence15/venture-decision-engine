
interface CompanyData {
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  additionalInvestmentRequested: number;
}

export function buildFinancialMetricsSummary(company: CompanyData): string {
  const investmentAmount = (company.totalInvestment / 1000000).toFixed(1);
  const equityStake = company.equityStake;
  
  // Build the core metrics sentence with actual data
  let summary = `${company.companyName} has `;
  
  // Revenue growth
  if (company.revenueGrowth !== null) {
    summary += `${company.revenueGrowth}% YoY revenue growth`;
  } else {
    summary += `revenue growth data not available`;
  }
  
  // Burn multiple
  if (company.burnMultiple !== null) {
    summary += ` and maintains a burn multiple of ${company.burnMultiple}x`;
  } else {
    summary += ` and burn multiple data not available`;
  }
  
  // Runway
  if (company.runway !== null) {
    summary += `, with ${company.runway} months of runway remaining`;
  } else {
    summary += `, with runway data not available`;
  }
  
  // MOIC
  if (company.moic !== null) {
    summary += ` and a current MOIC of ${company.moic}x`;
  } else {
    summary += ` and MOIC data not available`;
  }
  
  // Investment details
  summary += ` based on our $${investmentAmount}M investment representing ${equityStake}% equity stake.`;
  
  return summary;
}

export function buildMetricsDataString(company: CompanyData): string {
  return `
FINANCIAL METRICS SUMMARY:
• Company: ${company.companyName}
• Total Investment: $${(company.totalInvestment / 1000000).toFixed(1)}M
• Equity Stake: ${company.equityStake}%
• Revenue Growth (YoY): ${company.revenueGrowth !== null ? company.revenueGrowth + '%' : 'Not available'}
• Burn Multiple: ${company.burnMultiple !== null ? company.burnMultiple + 'x' : 'Not available'}
• Current MOIC: ${company.moic !== null ? company.moic + 'x' : 'Not available'} 
• Runway: ${company.runway !== null ? company.runway + ' months' : 'Not available'}
• Additional Investment Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M
`;
}
