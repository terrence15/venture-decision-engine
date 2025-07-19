
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

// Enhanced MVI check with detailed logging
function checkMinimumViableInputs(company: CompanyData): boolean {
  console.log(`\n=== MVI Check for ${company.companyName} ===`);
  console.log('Raw company data:', {
    moic: company.moic,
    revenueGrowth: company.revenueGrowth,
    burnMultiple: company.burnMultiple,
    runway: company.runway,
    tam: company.tam,
    exitActivity: company.exitActivity,
    additionalInvestmentRequested: company.additionalInvestmentRequested,
    totalInvestment: company.totalInvestment,
    equityStake: company.equityStake
  });

  const criticalFields = [
    { field: 'moic', value: company.moic },
    { field: 'revenueGrowth', value: company.revenueGrowth },
    { field: 'burnMultiple', value: company.burnMultiple },
    { field: 'runway', value: company.runway }
  ];
  
  const missingFields = criticalFields.filter(field => 
    field.value === null || field.value === undefined || field.value === ''
  );
  
  console.log('Missing critical fields:', missingFields.map(f => f.field));
  console.log(`MVI Check Result: ${missingFields.length < 3 ? 'PASS' : 'FAIL'} (${missingFields.length}/4 missing)`);
  
  return missingFields.length < 3; // More lenient - fail only if 3+ critical fields missing
}

// Determine recommendation based on metrics
function determineRecommendation(company: CompanyData): string {
  const growth = company.revenueGrowth || 0;
  const burn = company.burnMultiple || 999;
  const runway = company.runway || 0;
  const moic = company.moic || 0;
  
  console.log(`Decision metrics for ${company.companyName}:`, { growth, burn, runway, moic });
  
  // Strong decline criteria
  if (burn > 4.0 && runway < 8) return 'Decline';
  if (growth < 0 && burn > 3.0) return 'Decline';
  if (runway < 4) return 'Decline';
  
  // Double Down criteria
  if (growth > 100 && burn < 1.5 && moic > 3.0) return 'Double Down';
  
  // Reinvest criteria
  if (growth > 50 && burn < 2.5 && runway > 15) return 'Reinvest';
  
  // Bridge criteria
  if (runway < 12 && growth > 20) return 'Bridge';
  
  // Default to Hold
  return 'Hold';
}

// Standardized fallback response
function generateFallbackResponse(): ComprehensiveAnalysisResult {
  return {
    recommendation: 'Hold - Insufficient Data',
    timingBucket: 'Hold',
    reasoning: 'Limited financial data prevents comprehensive investment analysis. Key metrics like revenue growth, burn rate, or runway are missing from current dataset.',
    confidence: 2,
    keyRisks: 'Incomplete data visibility limits accurate risk assessment and investment decision-making.',
    suggestedAction: 'Request updated financial statements and KPI dashboard before proceeding with investment decision.',
    externalSources: 'Limited external validation available',
    insufficientData: true
  };
}

export async function conductComprehensiveAnalysis(
  company: CompanyData,
  apiKey: string,
  perplexityApiKey?: string
): Promise<ComprehensiveAnalysisResult> {
  
  console.log(`\n🚀 STARTING COMPREHENSIVE ANALYSIS FOR ${company.companyName.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log('API Keys available:', {
    openai: !!apiKey,
    perplexity: !!perplexityApiKey
  });
  
  // Step 1: Check Minimum Viable Inputs
  if (!checkMinimumViableInputs(company)) {
    console.log(`❌ INSUFFICIENT DATA: ${company.companyName} failed MVI check`);
    return generateFallbackResponse();
  }

  console.log(`✅ MVI PASSED: ${company.companyName} has sufficient data for analysis`);

  // Step 2: Conduct External Research (if Perplexity API available)
  let externalResearch = null;
  if (perplexityApiKey) {
    try {
      console.log(`🔍 CONDUCTING EXTERNAL RESEARCH for ${company.companyName}...`);
      externalResearch = await conductExternalResearch(company.companyName, perplexityApiKey);
      console.log(`✅ EXTERNAL RESEARCH COMPLETE for ${company.companyName}`);
    } catch (error) {
      console.error(`⚠️  EXTERNAL RESEARCH FAILED for ${company.companyName}:`, error);
      externalResearch = null;
    }
  } else {
    console.log(`⚠️  NO PERPLEXITY KEY: Skipping external research for ${company.companyName}`);
  }

  // Step 3: Determine base recommendation
  const baseRecommendation = determineRecommendation(company);
  console.log(`📊 BASE RECOMMENDATION for ${company.companyName}: ${baseRecommendation}`);

  // Step 4: Build focused prompt for high-quality analysis
  const prompt = `You are a senior venture capital partner analyzing portfolio companies for investment decisions. 

COMPANY: ${company.companyName}

FINANCIAL METRICS:
- Revenue Growth: ${company.revenueGrowth !== null ? company.revenueGrowth + '% YoY' : 'Not available'}
- Burn Multiple: ${company.burnMultiple !== null ? company.burnMultiple + 'x' : 'Not available'}
- Current MOIC: ${company.moic !== null ? company.moic + 'x' : 'Not available'}
- Runway: ${company.runway !== null ? company.runway + ' months' : 'Not available'}
- Total Investment: $${(company.totalInvestment / 1000000).toFixed(1)}M
- Additional Capital Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M
- Current Equity Stake: ${company.equityStake}%
- TAM Assessment: ${company.tam}/5
- Exit Environment: ${company.exitActivity}

${externalResearch ? `
EXTERNAL MARKET INTELLIGENCE:
- Funding Landscape: ${externalResearch.fundingData}
- Hiring Trends: ${externalResearch.hiringTrends}
- Market Position: ${externalResearch.marketPositioning}
- Recent Developments: ${externalResearch.recentNews}
- Competitive Activity: ${externalResearch.competitorActivity}
` : ''}

ANALYSIS REQUIREMENTS:
1. Start your reasoning with the company's specific metrics (e.g., "The company has X% YoY revenue growth and maintains a burn multiple of Yx")
2. Reference at least 2-3 specific numbers from the data provided
3. For key risks, focus on external market factors, not internal operational issues
4. Be specific about investment amounts and timing
5. Base your recommendation on: ${baseRecommendation}

Provide your analysis in JSON format:
{
  "recommendation": "Specific recommendation with dollar amount",
  "timingBucket": "Investment timing category",
  "reasoning": "Start with specific metrics, then provide investment rationale",
  "confidence": "1-5 confidence score",
  "keyRisks": "External market risks with specifics",
  "suggestedAction": "Specific action with dollar amounts and milestones",
  "externalSources": "Research sources used"
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
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: 'You are a senior venture capital partner with expertise in portfolio management and investment analysis. Provide specific, data-driven investment recommendations using exact figures from the provided company data. Focus on external market factors for risk assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
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
      recommendation: analysis.recommendation || `${baseRecommendation} - Analysis incomplete`,
      timingBucket: analysis.timingBucket || baseRecommendation,
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess specific external risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: analysis.externalSources || (externalResearch?.sources.join(', ') || 'Limited external research available'),
      insufficientData: false
    };

    console.log(`✅ ANALYSIS COMPLETE for ${company.companyName}:`, {
      recommendation: result.recommendation,
      confidence: result.confidence
    });

    return result;

  } catch (error) {
    console.error(`❌ ANALYSIS ERROR for ${company.companyName}:`, error);
    
    // Return enhanced fallback with specific error context
    return {
      recommendation: `${baseRecommendation} - Technical Analysis Error`,
      timingBucket: baseRecommendation,
      reasoning: `Technical error during AI analysis prevented completion. Based on available metrics: Revenue Growth ${company.revenueGrowth}%, Burn Multiple ${company.burnMultiple}x, suggesting ${baseRecommendation.toLowerCase()} approach until detailed analysis can be completed.`,
      confidence: 2,
      keyRisks: 'Unable to complete comprehensive risk analysis due to technical error. Manual review recommended.',
      suggestedAction: `Consider ${baseRecommendation.toLowerCase()} for $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M request pending technical resolution and detailed analysis.`,
      externalSources: externalResearch?.sources.join(', ') || 'Limited external validation',
      insufficientData: true
    };
  }
}
