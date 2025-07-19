
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
  console.log(`=== MVI Check for ${company.companyName} ===`);
  console.log('Raw company data:', {
    moic: company.moic,
    revenueGrowth: company.revenueGrowth,
    burnMultiple: company.burnMultiple,
    runway: company.runway,
    tam: company.tam,
    exitActivity: company.exitActivity,
    additionalInvestmentRequested: company.additionalInvestmentRequested,
    arrTtm: company.arrTtm,
    totalInvestment: company.totalInvestment,
    equityStake: company.equityStake
  });

  const criticalFields = [
    { field: 'moic', value: company.moic },
    { field: 'revenueGrowth', value: company.revenueGrowth },
    { field: 'burnMultiple', value: company.burnMultiple },
    { field: 'runway', value: company.runway },
    { field: 'tam', value: company.tam },
    { field: 'exitActivity', value: company.exitActivity },
    { field: 'additionalInvestmentRequested', value: company.additionalInvestmentRequested }
  ];
  
  const missingFields = criticalFields.filter(field => 
    field.value === null || 
    field.value === undefined || 
    field.value === '' || 
    (typeof field.value === 'number' && field.value === 0 && field.field !== 'additionalInvestmentRequested')
  );
  
  console.log('Missing critical fields:', missingFields.map(f => f.field));
  console.log(`MVI Check Result: ${missingFields.length < 2 ? 'PASS' : 'FAIL'} (${missingFields.length}/7 missing)`);
  
  return missingFields.length < 2; // Fail if 2+ critical fields missing
}

// Determine recommendation based on metrics with clear thresholds
function determineRecommendation(company: CompanyData): string {
  const growth = company.revenueGrowth || 0;
  const burn = company.burnMultiple || 999;
  const runway = company.runway || 0;
  const moic = company.moic || 0;
  
  console.log(`Decision metrics for ${company.companyName}:`, { growth, burn, runway, moic });
  
  // Decline criteria (be more aggressive)
  if (burn > 3.0 && runway < 12) return 'Decline';
  if (growth < 20 && burn > 2.5) return 'Decline';
  if (moic < 0.5 && growth < 50) return 'Decline';
  if (runway < 6) return 'Decline';
  
  // Double Down criteria
  if (growth > 80 && burn < 1.5 && moic > 2.0) return 'Double Down';
  
  // Reinvest criteria
  if (growth > 50 && burn < 2.0 && runway > 12) return 'Reinvest (3-12 Months)';
  
  // Bridge criteria
  if (runway < 12 && growth > 30) return 'Bridge Capital Only';
  
  // Default to Hold for edge cases
  return 'Hold (3-6 Months)';
}

// Validate response uses Excel data with strict checking
function validateResponseQuality(response: any, company: CompanyData): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check reasoning starts with Excel figures
  const reasoning = response.reasoning || '';
  const hasStartingMetrics = reasoning.match(/^The company has.*?\d+(\.\d+)?.*?(and|with).*?\d+(\.\d+)?/);
  if (!hasStartingMetrics) {
    issues.push('Reasoning must start with specific Excel metrics');
  }
  
  // Check for specific figure inclusion
  const shouldInclude = [
    company.revenueGrowth?.toString(),
    company.burnMultiple?.toString(),
    company.moic?.toString(),
    (company.additionalInvestmentRequested / 1000000).toFixed(1)
  ].filter(Boolean);
  
  const missingFigures = shouldInclude.filter(figure => !reasoning.includes(figure as string));
  if (missingFigures.length > 2) {
    issues.push('Reasoning missing key Excel figures');
  }
  
  // Check key risks are external and specific
  const keyRisks = response.keyRisks || '';
  const genericTerms = ['market saturation', 'competitive pressure', 'economic downturn'];
  const hasGenericRisk = genericTerms.some(term => keyRisks.toLowerCase().includes(term));
  if (hasGenericRisk || keyRisks.length < 50) {
    issues.push('Key risks too generic - need specific external factors');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Standardized fallback response
function generateFallbackResponse(): ComprehensiveAnalysisResult {
  return {
    recommendation: 'Decline',
    timingBucket: 'Decline',
    reasoning: 'Missing critical inputs (e.g., growth, burn, TAM, exit environment), which prevents a responsible investment recommendation. Recommend declining this opportunity until updated data is provided.',
    confidence: 1,
    keyRisks: 'Lack of visibility into company performance, capital efficiency, or exit feasibility makes additional investment highly speculative.',
    suggestedAction: 'Request updated financials, capital plan, and growth KPIs before reassessing capital deployment.',
    externalSources: 'Limited data available',
    insufficientData: true
  };
}

export async function conductComprehensiveAnalysis(
  company: CompanyData,
  apiKey: string,
  perplexityApiKey?: string
): Promise<ComprehensiveAnalysisResult> {
  
  console.log(`\n=== STARTING COMPREHENSIVE ANALYSIS FOR ${company.companyName.toUpperCase()} ===`);
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
      console.log(`🔍 STARTING EXTERNAL RESEARCH for ${company.companyName}...`);
      externalResearch = await conductExternalResearch(company.companyName, perplexityApiKey);
      console.log(`✅ EXTERNAL RESEARCH COMPLETE for ${company.companyName}:`, {
        fundingData: externalResearch.fundingData.substring(0, 100) + '...',
        sources: externalResearch.sources
      });
    } catch (error) {
      console.error(`❌ EXTERNAL RESEARCH FAILED for ${company.companyName}:`, error);
    }
  } else {
    console.log(`⚠️  NO PERPLEXITY KEY: Skipping external research for ${company.companyName}`);
  }

  // Step 3: Determine base recommendation from metrics
  const baseRecommendation = determineRecommendation(company);
  console.log(`📊 BASE RECOMMENDATION for ${company.companyName}: ${baseRecommendation}`);

  // Step 4: Build ultra-strict prompt with MANDATORY requirements
  const prompt = `You are a senior VC partner making LIVE capital allocation decisions. You MUST follow the EXACT format requirements below or your response will be REJECTED.

❗ CRITICAL REQUIREMENTS - FAILURE TO FOLLOW = REJECTION:
1. Reasoning MUST start EXACTLY with: "The company has [specific metric] of [exact number] and [another metric] of [exact number]"
2. You MUST include at least 3 exact Excel figures from the data provided
3. Key risks MUST be external and specific (not generic market terms)
4. Recommendation must match the suggested base: ${baseRecommendation}

COMPANY: ${company.companyName}

📊 EXCEL PORTFOLIO DATA (MUST USE EXACT FIGURES):
- Revenue Growth: ${company.revenueGrowth}% YoY
- Burn Multiple: ${company.burnMultiple}x 
- Current MOIC: ${company.moic}x
- Runway: ${company.runway} months
- Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
- Capital Request: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M
- ARR TTM: ${company.arrTtm ? `$${(company.arrTtm / 1000000).toFixed(1)}M` : 'N/A'}
- Equity Stake: ${company.equityStake}%
- TAM Score: ${company.tam}/5
- Exit Activity: ${company.exitActivity}

${externalResearch ? `
🔍 EXTERNAL INTELLIGENCE (MUST REFERENCE SPECIFIC DETAILS):
• Recent Funding: ${externalResearch.fundingData}
• Team Growth: ${externalResearch.hiringTrends}
• Market Position: ${externalResearch.marketPositioning}
• News/Updates: ${externalResearch.recentNews}
• Competition: ${externalResearch.competitorActivity}
• Sources: ${externalResearch.sources.join(', ')}
` : '🔍 EXTERNAL RESEARCH: Limited validation (no Perplexity API)'}

📋 MANDATORY REASONING TEMPLATE (MUST FOLLOW EXACTLY):
"The company has grown ARR by [X]% YoY and maintains a burn multiple of [Y]x, with [specific external detail from research]. However, [specific concern with numbers]. [Tactical decision rationale with exact investment amount]."

📋 MANDATORY KEY RISKS TEMPLATE (MUST BE SPECIFIC):
Examples of GOOD risks: "Recent competitor Stripe raised $50M for similar B2B payments solution"; "Glassdoor shows 40% engineering turnover in past 6 months"; "Lead investor pulled out of Series B citing market conditions"
Examples of BAD risks: "Market saturation", "Competitive pressure", "Economic uncertainty"

REQUIRED JSON OUTPUT:
{
  "recommendation": "${baseRecommendation} + exact dollar amount (e.g., 'Decline - redirect $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M to top performers')",
  "timingBucket": "${baseRecommendation}",
  "reasoning": "MUST start with exact template above using Excel figures [X]% and [Y]x. Must end with specific capital amount justification.",
  "confidence": "1-5 (5=strong data+external validation, 1=weak/conflicting)",
  "keyRisks": "MUST be specific external factors with numbers/names/dates - NO generic terms allowed",
  "suggestedAction": "Deploy/Bridge/Decline $[exact amount] with [specific milestone/metric] tracking",
  "externalSources": "${externalResearch?.sources.join(', ') || 'Limited external validation'}"
}

🚨 FINAL VALIDATION CHECKLIST:
✓ Reasoning starts with "The company has grown ARR by [X]% YoY and maintains a burn multiple of [Y]x"
✓ At least 3 Excel figures used (growth %, burn multiple, runway, investment amount, etc.)
✓ Key risks mention specific companies, people, dates, or numbers
✓ Recommendation matches suggested: ${baseRecommendation}
✓ Exact dollar amounts specified throughout

Generate response now (any deviation from format will be rejected):`;

  console.log(`📤 SENDING STRICT ANALYSIS REQUEST TO OPENAI for ${company.companyName}...`);

  // Attempt analysis with retry logic for quality
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🔄 Analysis attempt ${attempts}/${maxAttempts} for ${company.companyName}`);
    
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
              content: 'You are a senior venture capital partner with 15+ years of portfolio management experience. You make data-driven investment decisions using precise financial metrics and external market intelligence. You MUST follow the exact format requirements provided. Generic or vague responses will be REJECTED. You MUST use exact figures from Excel data and cite specific external details.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.05, // Lower temperature for more consistent format adherence
          max_tokens: 2500,
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

      console.log(`📥 RAW AI RESPONSE (attempt ${attempts}) for ${company.companyName}:`, content);

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ JSON PARSING FAILED for response:', content);
        if (attempts < maxAttempts) {
          console.log('🔄 Retrying due to JSON parsing failure...');
          continue;
        }
        throw new Error('Could not parse JSON response from OpenAI');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log(`📊 PARSED ANALYSIS (attempt ${attempts}) for ${company.companyName}:`, analysis);
      
      // Validate response quality
      const validation = validateResponseQuality(analysis, company);
      if (!validation.isValid && attempts < maxAttempts) {
        console.log(`⚠️  QUALITY ISSUES (attempt ${attempts}):`, validation.issues);
        console.log('🔄 Retrying for better quality...');
        continue;
      }

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

      console.log(`✅ ANALYSIS COMPLETE (attempt ${attempts}) for ${company.companyName}:`, {
        recommendation: result.recommendation,
        confidence: result.confidence,
        qualityIssues: validation.issues
      });

      return result;

    } catch (error) {
      console.error(`❌ ANALYSIS ATTEMPT ${attempts} ERROR for ${company.companyName}:`, error);
      if (attempts >= maxAttempts) {
        throw new Error(error instanceof Error ? error.message : 'Failed to analyze company data');
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Should never reach here, but just in case
  throw new Error('All analysis attempts failed');
}
