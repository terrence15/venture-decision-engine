
import { conductComprehensiveAnalysis } from './comprehensiveAnalysis';
import { EnhancedCompanyData } from '../types/portfolio';

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
  company: EnhancedCompanyData, 
  apiKey: string,
  perplexityApiKey?: string
): Promise<AnalysisResult> {
  
  console.log(`\n🚀 ANALYZING ${company.companyName.toUpperCase()} with Enhanced AI System`);
  console.log('='.repeat(60));
  console.log('System Configuration:', {
    openaiApi: !!apiKey,
    perplexityApi: !!perplexityApiKey,
    externalResearch: !!perplexityApiKey,
    company: company.companyName
  });
  
  try {
    const startTime = Date.now();
    const result = await conductComprehensiveAnalysis(company, apiKey, perplexityApiKey);
    const duration = Date.now() - startTime;
    
    console.log(`✅ ANALYSIS SUCCESSFUL for ${company.companyName} (${duration}ms)`);
    console.log('Final Result:', {
      recommendation: result.recommendation.substring(0, 50) + '...',
      confidence: result.confidence,
      insufficientData: result.insufficientData
    });
    
    return result;
  } catch (error) {
    console.error(`❌ ANALYSIS FAILED for ${company.companyName}:`, error);
    
    // Enhanced error fallback with more specific messaging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      recommendation: 'Analysis failed - Technical error',
      timingBucket: 'N/A',
      reasoning: `Technical error during AI analysis: ${errorMessage}. This could be due to API connectivity issues, rate limiting, or data formatting problems. Please retry the analysis or check your API keys.`,
      confidence: 1,
      keyRisks: 'Unable to complete analysis due to technical issues. Manual review recommended.',
      suggestedAction: 'Retry analysis with valid API keys, or conduct manual investment review using available Excel data.',
      externalSources: 'Analysis incomplete due to technical error',
      insufficientData: true
    };
  }
}

export async function analyzePortfolio(
  companies: EnhancedCompanyData[], 
  apiKey: string,
  perplexityApiKey?: string,
  onProgress?: (progress: number) => void
): Promise<EnhancedCompanyData[]> {
  const results: EnhancedCompanyData[] = [];
  
  console.log(`\n🏁 STARTING PORTFOLIO ANALYSIS`);
  console.log('='.repeat(60));
  console.log(`Companies to analyze: ${companies.length}`);
  console.log('System capabilities:', {
    openaiAnalysis: !!apiKey,
    externalResearch: !!perplexityApiKey,
    progressTracking: !!onProgress
  });
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const progress = ((i + 1) / companies.length) * 100;
    onProgress?.(progress);
    
    console.log(`\n📊 Analyzing company ${i + 1}/${companies.length}: ${company.companyName}`);
    console.log('Company metrics preview:', {
      investment: company.totalInvestment,
      equity: company.equityStake,
      growth: company.revenueGrowth,
      burn: company.burnMultiple,
      request: company.additionalInvestmentRequested
    });
    
    try {
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
      
      console.log(`✅ Company ${i + 1} complete: ${company.companyName}`);
      
      // Rate limiting with progress indication
      if (i < companies.length - 1) {
        console.log('⏱️  Rate limiting pause (2s)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to analyze ${company.companyName}:`, error);
      results.push({
        ...company,
        recommendation: 'Analysis failed',
        timingBucket: 'N/A',
        reasoning: 'Technical error during analysis. Please try again with valid API keys.',
        confidence: 1,
        keyRisks: 'Unable to complete analysis due to technical issues.',
        suggestedAction: 'Retry analysis or conduct manual review.',
        externalSources: 'Analysis incomplete',
        insufficientData: true
      } as any);
    }
  }
  
  console.log(`\n🎉 PORTFOLIO ANALYSIS COMPLETE`);
  console.log('='.repeat(60));
  console.log(`Total companies processed: ${results.length}`);
  console.log(`Successful analyses: ${results.filter(r => !r.insufficientData).length}`);
  console.log(`Failed analyses: ${results.filter(r => r.insufficientData).length}`);
  
  return results;
}
