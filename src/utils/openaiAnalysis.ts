
import { conductComprehensiveAnalysis } from './comprehensiveAnalysis';

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
  // Additional Excel fields
  arrTtm?: number;
  ebitdaMargin?: number;
  topPerformer?: boolean;
  valuationMethodology?: string;
}

interface AnalysisResult {
  recommendation: string;
  timingBucket: string;
  reasoning: string;
  confidence: number;
  keyRisks: string;
  suggestedAction: string;
  externalSources: string;
  insufficientData: boolean;
}

export async function analyzeCompanyWithOpenAI(
  company: CompanyData, 
  apiKey: string,
  perplexityApiKey?: string
): Promise<AnalysisResult> {
  
  console.log(`Analyzing ${company.companyName} with comprehensive AI system...`);
  
  try {
    return await conductComprehensiveAnalysis(company, apiKey, perplexityApiKey);
  } catch (error) {
    console.error(`Analysis failed for ${company.companyName}:`, error);
    
    // Return error fallback
    return {
      recommendation: 'Analysis failed',
      timingBucket: 'N/A',
      reasoning: 'Technical error during analysis. Please try again.',
      confidence: 1,
      keyRisks: 'Unable to complete analysis due to technical issues.',
      suggestedAction: 'Retry analysis or conduct manual review.',
      externalSources: 'Analysis incomplete',
      insufficientData: true
    };
  }
}

export async function analyzePortfolio(
  companies: CompanyData[], 
  apiKey: string,
  perplexityApiKey?: string,
  onProgress?: (progress: number) => void
): Promise<CompanyData[]> {
  const results: CompanyData[] = [];
  
  console.log(`Starting portfolio analysis for ${companies.length} companies...`);
  console.log('Using comprehensive analysis system with:', {
    openaiApi: !!apiKey,
    perplexityApi: !!perplexityApiKey,
    externalResearch: !!perplexityApiKey
  });
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const progress = ((i + 1) / companies.length) * 100;
    onProgress?.(progress);
    
    try {
      console.log(`Analyzing company ${i + 1}/${companies.length}: ${company.companyName}`);
      const analysis = await analyzeCompanyWithOpenAI(company, apiKey, perplexityApiKey);
      
      results.push({
        ...company,
        recommendation: analysis.recommendation,
        timingBucket: analysis.timingBucket,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
        keyRisks: analysis.keyRisks,
        suggestedAction: analysis.suggestedAction,
        externalSources: analysis.externalSources,
        insufficientData: analysis.insufficientData
      } as any);
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to analyze ${company.companyName}:`, error);
      results.push({
        ...company,
        recommendation: 'Analysis failed',
        timingBucket: 'N/A',
        reasoning: 'Technical error during analysis. Please try again.',
        confidence: 1,
        keyRisks: 'Unable to complete analysis due to technical issues.',
        suggestedAction: 'Retry analysis or conduct manual review.',
        externalSources: 'Analysis incomplete',
        insufficientData: true
      } as any);
    }
  }
  
  console.log(`Portfolio analysis complete. Analyzed ${results.length} companies.`);
  return results;
}
