
import { conductExternalResearch } from './externalResearch';

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

  // Step 2: Conduct External Research (if available)
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

  // Step 3: Build the original working prompt that produced specific results
  const prompt = `Analyze this portfolio company for investment decisions:

COMPANY: ${company.companyName}

FINANCIAL METRICS:
• Total Investment: $${(company.totalInvestment / 1000000).toFixed(1)}M
• Current Equity Stake: ${company.equityStake}%
• Revenue Growth (YoY): ${company.revenueGrowth !== null ? company.revenueGrowth + '%' : 'Not available'}
• Burn Multiple: ${company.burnMultiple !== null ? company.burnMultiple + 'x' : 'Not available'}
• Current MOIC: ${company.moic !== null ? company.moic + 'x' : 'Not available'} 
• Runway: ${company.runway !== null ? company.runway + ' months' : 'Not available'}
• Additional Investment Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M
• TAM Score: ${company.tam}/5
• Exit Environment: ${company.exitActivity}
• Barrier to Entry: ${company.barrierToEntry}/5

${externalResearch ? `
EXTERNAL MARKET RESEARCH:
• Recent Funding Activity: ${externalResearch.fundingData}
• Hiring & Growth Trends: ${externalResearch.hiringTrends}
• Market Position & Competitors: ${externalResearch.marketPositioning}
• Recent Company News: ${externalResearch.recentNews}
• Competitive Landscape: ${externalResearch.competitorActivity}
` : ''}

ANALYSIS REQUIREMENTS:
You are a senior VC partner making investment decisions. Provide a specific, data-driven analysis that:

1. STARTS with the exact financial metrics (e.g., "The company has X% YoY revenue growth and maintains a burn multiple of Yx")
2. References specific competitors and market conditions when possible
3. Provides concrete investment recommendations with dollar amounts
4. Focuses on external market risks, not internal operational issues
5. Uses specific industry benchmarks and comparisons

Return your analysis in this exact JSON format:
{
  "recommendation": "Specific investment recommendation with dollar amount",
  "timingBucket": "One of: Reinvest, Double Down, Bridge, Hold, Decline",
  "reasoning": "Start with specific company metrics, then provide detailed investment rationale citing exact numbers",
  "confidence": "Integer 1-5",
  "keyRisks": "Focus on external market risks with specific industry examples",
  "suggestedAction": "Concrete next steps with specific dollar amounts and timeframes",
  "externalSources": "List research sources used"
}`;

  console.log(`📤 SENDING ANALYSIS REQUEST TO OPENAI for ${company.companyName}...`);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a senior venture capital partner with 15+ years experience in portfolio management. Provide specific, data-driven investment analysis using exact metrics from the company data. Reference specific competitors, market conditions, and industry benchmarks. Always start your reasoning with the company\'s exact financial metrics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OPENAI API ERROR:', errorData);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    console.log(`📥 RAW AI RESPONSE for ${company.companyName}:`, content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ JSON PARSING FAILED for response:', content);
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`📊 PARSED ANALYSIS for ${company.companyName}:`, analysis);
    
    const result = {
      recommendation: analysis.recommendation || 'Hold - Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold',
      reasoning: analysis.reasoning || 'Analysis could not be completed.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks.',
      suggestedAction: analysis.suggestedAction || 'Request additional data.',
      externalSources: analysis.externalSources || (externalResearch?.sources.join(', ') || 'Limited external research'),
      insufficientData: false
    };

    console.log(`✅ ANALYSIS COMPLETE for ${company.companyName}`);
    return result;

  } catch (error) {
    console.error(`❌ ANALYSIS ERROR for ${company.companyName}:`, error);
    
    return {
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      reasoning: 'Technical error prevented analysis completion. Manual review recommended.',
      confidence: 1,
      keyRisks: 'Unable to complete analysis due to technical issues.',
      suggestedAction: 'Retry analysis or conduct manual review.',
      externalSources: externalResearch?.sources.join(', ') || 'Limited external research',
      insufficientData: true
    };
  }
}
