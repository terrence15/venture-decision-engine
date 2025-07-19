
import { conductExternalResearch } from './externalResearch';
import { buildFinancialMetricsSummary } from './financialMetricsSummary';
import { generateBusinessAnalysis } from './businessAnalysisGenerator';

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
}

interface ComprehensiveAnalysisResult {
  recommendation: string;
  timingBucket: string;
  reasoning: string;
  confidence: number;
  keyRisks: string;
  suggestedAction: string;
  externalSources: string;
  insufficientData: boolean;
}

function hasMinimumData(company: CompanyData): boolean {
  const hasFinancialData = (
    company.moic !== null || 
    company.revenueGrowth !== null || 
    company.burnMultiple !== null || 
    company.runway !== null
  );
  
  const hasBasicData = (
    company.totalInvestment > 0 && 
    company.additionalInvestmentRequested > 0
  );
  
  return hasFinancialData && hasBasicData;
}

export async function conductComprehensiveAnalysis(
  company: CompanyData,
  apiKey: string,
  perplexityApiKey?: string
): Promise<ComprehensiveAnalysisResult> {
  
  // Check minimum data requirements
  if (!hasMinimumData(company)) {
    return {
      recommendation: 'Hold - Insufficient Data',
      timingBucket: 'Hold',
      reasoning: 'Limited financial data prevents comprehensive investment analysis.',
      confidence: 2,
      keyRisks: 'Incomplete data visibility limits accurate risk assessment.',
      suggestedAction: 'Request updated financial statements before proceeding.',
      externalSources: 'Limited external validation available',
      insufficientData: true
    };
  }

  // Generate financial metrics summary
  const financialSummary = buildFinancialMetricsSummary(company);

  // Conduct external research if API key available
  let externalResearch = null;
  if (perplexityApiKey && perplexityApiKey.trim() !== '') {
    try {
      externalResearch = await conductExternalResearch(company.companyName, perplexityApiKey);
    } catch (error) {
      console.error(`External research failed for ${company.companyName}:`, error);
    }
  }

  // Generate business analysis
  try {
    const businessAnalysis = await generateBusinessAnalysis(company, apiKey, externalResearch || undefined);
    
    const combinedReasoning = `${financialSummary} ${businessAnalysis.marketAnalysis}`;
    
    return {
      recommendation: businessAnalysis.recommendation,
      timingBucket: businessAnalysis.timingBucket,
      reasoning: combinedReasoning,
      confidence: businessAnalysis.confidence,
      keyRisks: businessAnalysis.keyRisks,
      suggestedAction: businessAnalysis.suggestedAction,
      externalSources: externalResearch?.sources.join(', ') || 'Internal analysis only',
      insufficientData: false
    };

  } catch (error) {
    return {
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      reasoning: `${financialSummary} Technical error prevented full analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 1,
      keyRisks: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Retry analysis with valid API key or conduct manual review.',
      externalSources: externalResearch?.sources.join(', ') || 'Limited external research',
      insufficientData: true
    };
  }
}
