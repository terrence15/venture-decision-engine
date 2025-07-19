
import { conductExternalResearch } from './externalResearch';
import { buildFinancialMetricsSummary, buildMetricsDataString } from './financialMetricsSummary';
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
  // Additional fields from Excel
  arrTtm?: number;
  ebitdaMargin?: number;
  topPerformer?: boolean;
  valuationMethodology?: string;
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

// Simplified MVI check - only fail if we have almost no data
function checkMinimumViableInputs(company: CompanyData): boolean {
  console.log(`\n=== MVI Check for ${company.companyName} ===`);
  
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
  
  const result = hasFinancialData && hasBasicData;
  console.log(`MVI Check Result: ${result ? 'PASS' : 'FAIL'}`);
  return result;
}

export async function conductComprehensiveAnalysis(
  company: CompanyData,
  apiKey: string,
  perplexityApiKey?: string
): Promise<ComprehensiveAnalysisResult> {
  
  console.log(`\n🚀 STARTING COMPREHENSIVE ANALYSIS FOR ${company.companyName.toUpperCase()}`);
  
  // Step 1: Check if we have enough data
  if (!checkMinimumViableInputs(company)) {
    console.log(`❌ INSUFFICIENT DATA: ${company.companyName} failed MVI check`);
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

  // Step 2: Generate Guaranteed Financial Metrics Summary
  console.log(`📊 BUILDING FINANCIAL METRICS SUMMARY for ${company.companyName}...`);
  const financialSummary = buildFinancialMetricsSummary(company);
  console.log(`✅ Financial Summary: ${financialSummary}`);

  // Step 3: Conduct External Research (if available)
  let externalResearch = null;
  if (perplexityApiKey) {
    try {
      console.log(`🔍 CONDUCTING EXTERNAL RESEARCH for ${company.companyName}...`);
      externalResearch = await conductExternalResearch(company.companyName, perplexityApiKey);
      console.log(`✅ EXTERNAL RESEARCH COMPLETE for ${company.companyName}`);
    } catch (error) {
      console.error(`⚠️  EXTERNAL RESEARCH FAILED for ${company.companyName}:`, error);
    }
  }

  // Step 4: Generate Business Analysis
  console.log(`📤 GENERATING BUSINESS ANALYSIS for ${company.companyName}...`);
  
  try {
    const businessAnalysis = await generateBusinessAnalysis(company, apiKey, externalResearch || undefined);
    
    // Step 5: Combine Financial Metrics + Business Analysis
    const combinedReasoning = `${financialSummary} ${businessAnalysis.marketAnalysis}`;
    
    console.log(`✅ COMPREHENSIVE ANALYSIS COMPLETE for ${company.companyName}`);
    console.log(`Final Reasoning: ${combinedReasoning.substring(0, 100)}...`);
    
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
    console.error(`❌ BUSINESS ANALYSIS ERROR for ${company.companyName}:`, error);
    
    // Fallback with guaranteed financial metrics
    return {
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      reasoning: `${financialSummary} Technical error prevented full market analysis completion. Manual review recommended.`,
      confidence: 1,
      keyRisks: 'Unable to complete comprehensive analysis due to technical issues.',
      suggestedAction: 'Retry analysis or conduct manual review.',
      externalSources: externalResearch?.sources.join(', ') || 'Limited external research',
      insufficientData: true
    };
  }
}
