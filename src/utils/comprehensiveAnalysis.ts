
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

// Validate AI response contains Excel data
function validateResponseUsesExcelData(response: string, company: CompanyData): boolean {
  const hasExcelReference = 
    (company.revenueGrowth && response.includes(company.revenueGrowth.toString())) ||
    (company.burnMultiple && response.includes(company.burnMultiple.toString())) ||
    (company.arrTtm && response.includes((company.arrTtm / 1000000).toFixed(1))) ||
    (company.moic && response.includes(company.moic.toString())) ||
    (company.runway && response.includes(company.runway.toString()));
  
  console.log(`Excel data validation for ${company.companyName}: ${hasExcelReference ? 'PASS' : 'FAIL'}`);
  if (!hasExcelReference) {
    console.log('AI response does not contain Excel figures:', response.substring(0, 200));
  }
  
  return hasExcelReference;
}

// Standardized fallback response
function generateFallbackResponse(): ComprehensiveAnalysisResult {
  return {
    recommendation: 'Insufficient data to assess',
    timingBucket: 'N/A',
    reasoning: 'Missing critical inputs (e.g., growth, burn, TAM, exit environment), which prevents a responsible investment recommendation. Recommend holding until updated data is provided.',
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

  // Step 3: Build comprehensive prompt with STRICT Excel data requirements
  const prompt = `You are a venture capital partner making LIVE CAPITAL ALLOCATION decisions. You MUST integrate exact figures from our internal Excel portfolio data with external market intelligence to generate tactical investment recommendations.

❗ CRITICAL REQUIREMENT: Your reasoning MUST start with specific Excel figures. Generic responses will be rejected.

COMPANY: ${company.companyName}

📊 INTERNAL EXCEL PORTFOLIO DATA (USE EXACT FIGURES):
- Total Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
- Current Equity Stake: ${company.equityStake}%
- Current Implied MOIC: ${company.moic}x
- TTM Revenue Growth Rate: ${company.revenueGrowth}%
- ARR (TTM): ${company.arrTtm ? `$${(company.arrTtm / 1000000).toFixed(1)}M` : 'Not Available'}
- Net Burn Multiple: ${company.burnMultiple}x (Burn Rate / Net New ARR)
- Current Runway: ${company.runway} months
- EBITDA Margin: ${company.ebitdaMargin ? `${company.ebitdaMargin}%` : 'Not Available'}
- TAM Assessment: ${company.tam}/5 (Market Size & Growth Potential)
- Exit Environment: ${company.exitActivity}
- Competitive Moat: ${company.barrierToEntry}/5 (Barrier to Entry)
- Top Quartile Performer: ${company.topPerformer ? 'Yes' : 'No'}
- Capital Request: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M

${externalResearch ? `
🔍 EXTERNAL MARKET INTELLIGENCE:
• Funding Environment: ${externalResearch.fundingData}
• Team Growth Signals: ${externalResearch.hiringTrends}
• Market Position: ${externalResearch.marketPositioning}
• Recent Developments: ${externalResearch.recentNews}
• Competitive Landscape: ${externalResearch.competitorActivity}
• Validated Sources: ${externalResearch.sources.join(', ')}
` : '🔍 EXTERNAL RESEARCH: Limited external validation available (no Perplexity API)'}

🎯 DECISION FRAMEWORK (Portfolio Management Model):
• Revenue Growth > 50% YoY = Strong Growth Signal
• Burn Multiple < 1.5x = Capital Efficient | > 2.5x = Concerning
• MOIC > 1.5x = Attractive Returns | < 1.0x = Underwater
• Runway < 6 months = Urgent | > 18 months = Comfortable
• Exit Activity "High" = Favorable Exit Environment
• TAM Score 4-5 = Large Addressable Market
• Barrier to Entry ≥ 4 = Defensible Position

⚠️  MANDATORY OUTPUT REQUIREMENTS:
1. REASONING must start with: "The company has [specific Excel metric] and..." 
2. Include at least 2 exact figures from Excel data in first sentence
3. Reference external validation if available
4. End with tactical capital deployment decision

REQUIRED JSON OUTPUT FORMAT:
{
  "recommendation": "Specific capital decision with exact dollar amount (e.g., 'Invest $250K of $1M request', 'Bridge $150K pending Series B traction', 'Decline - redirect capital to top performers')",
  "timingBucket": "One of: Double Down, Reinvest (3-12 Months), Hold (3-6 Months), Bridge Capital Only, Exit Opportunistically, Decline",
  "reasoning": "MUST start with Excel data: 'The company has grown ARR by [X]% YoY with a burn multiple of [Y]x, indicating [assessment].' Then add external validation and tactical rationale. Must be 3-4 sentences ending with specific capital amount justification.",
  "confidence": "Integer 1-5 (5=strong Excel data + external validation, 3=solid Excel + mixed external, 1=weak data/external conflicts)",
  "keyRisks": "Must include 1+ external market risk from research (e.g., 'increasing competitive pressure from [competitor]', 'talent acquisition challenges in current market', 'category saturation risk'). Cannot be purely Excel-derived.",
  "suggestedAction": "Tactical next steps tied to data gaps: 'Deploy $[amount] with monthly [specific metric] reporting; reassess post-[specific milestone]'",
  "externalSources": "List research sources used: ${externalResearch?.sources.join(', ') || 'Limited external validation'}"
}

🚨 VALIDATION CHECKLIST BEFORE RESPONDING:
✓ Reasoning starts with specific Excel figures (growth %, burn multiple, etc.)
✓ Exact capital amount specified in recommendation  
✓ External risk identified (not just Excel metrics)
✓ Tactical action tied to specific reporting requirements
✓ All figures match the Excel data provided above

Generate investment recommendation now:`;

  console.log(`📤 SENDING ANALYSIS REQUEST TO OPENAI for ${company.companyName}...`);
  console.log('Prompt length:', prompt.length);
  console.log('Key Excel figures being sent:', {
    revenueGrowth: company.revenueGrowth,
    burnMultiple: company.burnMultiple,
    moic: company.moic,
    runway: company.runway,
    investment: company.totalInvestment,
    request: company.additionalInvestmentRequested
  });

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
            content: 'You are a senior venture capital partner with 15+ years of portfolio management experience. You make data-driven investment decisions using precise financial metrics and external market intelligence. You MUST use exact figures from Excel data in every response. Generic responses will be rejected.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
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

    console.log(`📥 RAW AI RESPONSE for ${company.companyName}:`, content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ JSON PARSING FAILED for response:', content);
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`📊 PARSED ANALYSIS for ${company.companyName}:`, analysis);
    
    // Validate response uses Excel data
    const usesExcelData = validateResponseUsesExcelData(analysis.reasoning || '', company);
    if (!usesExcelData) {
      console.warn(`⚠️  QUALITY WARNING: AI response may not be using Excel data effectively`);
    }

    const result = {
      recommendation: analysis.recommendation || 'Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold (3-6 Months)',
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: analysis.externalSources || (externalResearch?.sources.join(', ') || 'Limited external research available'),
      insufficientData: false
    };

    console.log(`✅ ANALYSIS COMPLETE for ${company.companyName}:`, {
      recommendation: result.recommendation,
      confidence: result.confidence,
      usedExcelData: usesExcelData
    });

    return result;

  } catch (error) {
    console.error(`❌ COMPREHENSIVE ANALYSIS ERROR for ${company.companyName}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze company data');
  }
}
