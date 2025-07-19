
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

interface ExternalResearch {
  fundingHistory: string;
  teamGrowth: string;
  competitorActivity: string;
  marketSignals: string;
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

// Generic terms that trigger response rejection
const GENERIC_TERMS = [
  'established a clear leadership position',
  'moderate market and operational risks',
  'continued monitoring is recommended',
  'niche market size may limit',
  'supported by experienced management',
  'positive customer traction',
  'category saturation risk',
  'low barriers to entry',
  'lack of recent external market validation'
];

function hasGenericTerms(text: string): boolean {
  return GENERIC_TERMS.some(term => text.toLowerCase().includes(term.toLowerCase()));
}

function validateDataSufficiency(company: CompanyData): boolean {
  console.log('Validating data sufficiency for:', company.companyName);
  console.log('Company data:', {
    moic: company.moic,
    revenueGrowth: company.revenueGrowth,
    burnMultiple: company.burnMultiple,
    runway: company.runway,
    tam: company.tam,
    additionalInvestmentRequested: company.additionalInvestmentRequested
  });

  const criticalFields = [
    company.moic,
    company.revenueGrowth,
    company.burnMultiple || company.runway,
    company.tam,
    company.additionalInvestmentRequested
  ];
  
  const missingCriticalData = criticalFields.filter(field => {
    if (field === null || field === undefined) return true;
    if (typeof field === 'string' && field === '') return true;
    if (typeof field === 'number' && field === 0) return false; // 0 is valid for numbers
    return !field; // catch other falsy values
  }).length;
  
  console.log('Missing critical data count:', missingCriticalData);
  return missingCriticalData < 3; // More lenient threshold
}

async function getExternalResearch(companyName: string): Promise<ExternalResearch> {
  // Simulate external research - in production, this would call Perplexity API
  console.log('Getting external research for:', companyName);
  
  return {
    fundingHistory: `Recent Series A of $5M led by Acme Ventures in Q2 2024`,
    teamGrowth: `LinkedIn shows 25% increase in engineering headcount over past 6 months`,
    competitorActivity: `Competitor XYZ raised $10M Series B, signaling market validation`,
    marketSignals: `TechCrunch coverage of sector consolidation trends`
  };
}

function determineRecommendation(company: CompanyData): string {
  console.log('Determining recommendation for:', company.companyName);
  
  const burnMultiple = company.burnMultiple || 0;
  const runway = company.runway || 0;
  const moic = company.moic || 0;
  const revenueGrowth = company.revenueGrowth || 0;
  
  console.log('Decision factors:', { burnMultiple, runway, moic, revenueGrowth });
  
  // Aggressive decline thresholds
  if (burnMultiple > 4 || runway < 6 || (moic < 0.5 && revenueGrowth < 20)) {
    return 'Decline';
  }
  
  // Conservative investment thresholds
  if (burnMultiple < 2 && runway > 18 && moic > 2 && revenueGrowth > 50) {
    const requestedAmount = company.additionalInvestmentRequested / 1000000;
    return `Invest $${requestedAmount.toFixed(1)}M`;
  }
  
  // Bridge capital for moderate cases
  if (runway < 12 && moic > 1) {
    const bridgeAmount = Math.min(company.additionalInvestmentRequested * 0.5, 1000000);
    return `Bridge Capital Only - $${(bridgeAmount / 1000000).toFixed(1)}M`;
  }
  
  return 'Hold (3-6 Months)';
}

function createStructuredPrompt(company: CompanyData, research: ExternalResearch): string {
  return `You are a VC partner making a capital allocation decision. Use this EXACT template and fill in the blanks with specific data:

COMPANY: ${company.companyName}
EXCEL DATA:
- Revenue Growth: ${company.revenueGrowth}% YoY
- Burn Multiple: ${company.burnMultiple}x
- Current MOIC: ${company.moic}x
- Runway: ${company.runway} months
- Additional Capital Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M

EXTERNAL RESEARCH:
- Funding: ${research.fundingHistory}
- Team Growth: ${research.teamGrowth}
- Competition: ${research.competitorActivity}

FILL IN THIS TEMPLATE EXACTLY:

{
  "reasoning": "The company has [EXACT REVENUE GROWTH]% YoY revenue growth and maintains a burn multiple of [EXACT BURN MULTIPLE]x. [SPECIFIC EXTERNAL VALIDATION from research]. However, [SPECIFIC RISK from data]. [INVESTMENT LOGIC based on metrics].",
  "keyRisks": "[MARKET/COMPETITIVE RISK with specific details]; [INVESTOR/DILUTION RISK based on runway and capital request].",
  "confidence": [1-5 number based on data quality],
  "suggestedAction": "[ONE SPECIFIC TACTICAL NEXT STEP]"
}

CRITICAL KEY RISKS REQUIREMENTS:
- Focus on EXTERNAL market risks, not internal operational issues
- Include competitive positioning threats and market dynamics
- Address investor concerns like dilution, pricing power, market saturation
- Use investor-specific language: "dilution risk", "pricing power", "market saturation", "capital efficiency"

GOOD KEY RISKS EXAMPLES:
- "Unclear pricing power in crowded market; potential dilution given tight runway"
- "Market saturation risk as competitors raise larger rounds; runway pressures may force unfavorable terms"
- "Competitive moats unclear given low barriers to entry; burn rate indicates capital efficiency concerns"

BAD KEY RISKS (AVOID):
- "Competitor XYZ's larger Series B may accelerate their market share gains"
- "High burn multiple with low revenue growth threatens sustainability"
- Generic operational risks or company-specific issues

REQUIREMENTS:
- Start reasoning with exact Excel figures
- Include specific external research details  
- Make risks MARKET-FOCUSED and INVESTOR-SPECIFIC
- No generic business language or operational risks
- Be decisive, not wishy-washy`;
}

async function validateResponse(response: AnalysisResult, company: CompanyData): Promise<boolean> {
  console.log('Validating response quality for:', company.companyName);
  
  // Check for generic terms
  if (hasGenericTerms(response.reasoning) || hasGenericTerms(response.keyRisks)) {
    console.log('Response contains generic terms - rejecting');
    return false;
  }
  
  // Check if reasoning starts with specific Excel figures
  const reasoningStartsWithMetrics = response.reasoning.includes(`${company.revenueGrowth}%`) || 
                                   response.reasoning.includes(`${company.burnMultiple}x`) ||
                                   response.reasoning.includes(`${company.moic}x`);
  
  if (!reasoningStartsWithMetrics) {
    console.log('Reasoning does not start with Excel metrics - rejecting');
    return false;
  }
  
  // Check for specific risk content and market focus
  if (response.keyRisks.length < 50 || !response.keyRisks.includes(';')) {
    console.log('Key risks too generic or short - rejecting');
    return false;
  }
  
  // Reject generic operational risks
  const operationalRiskTerms = ['competitor xyz', 'high burn multiple', 'threatens sustainability', 'market share gains'];
  if (operationalRiskTerms.some(term => response.keyRisks.toLowerCase().includes(term))) {
    console.log('Key risks contain operational/generic terms - rejecting');
    return false;
  }
  
  // Require investor-focused language
  const investorTerms = ['dilution', 'pricing power', 'market saturation', 'capital efficiency', 'runway pressure', 'unfavorable terms'];
  if (!investorTerms.some(term => response.keyRisks.toLowerCase().includes(term))) {
    console.log('Key risks lack investor-specific language - rejecting');
    return false;
  }
  
  console.log('Response validation passed');
  return true;
}

export async function analyzeCompanyWithOpenAI(
  company: CompanyData, 
  apiKey: string
): Promise<AnalysisResult> {
  console.log('Starting comprehensive analysis for:', company.companyName);
  
  // Data sufficiency check
  if (!validateDataSufficiency(company)) {
    console.log('Insufficient data - returning default response');
    return {
      recommendation: 'Decline',
      timingBucket: 'N/A',
      reasoning: 'Missing critical performance metrics prevents responsible investment assessment. Company lacks sufficient data visibility for capital deployment decision.',
      confidence: 1,
      keyRisks: 'Data opacity creates investment blind spots; inability to assess capital efficiency or growth trajectory increases downside risk.',
      suggestedAction: 'Request comprehensive financial package including ARR growth, unit economics, and 18-month cash flow projections.',
      externalSources: 'Limited data available for external validation',
      insufficientData: true
    };
  }

  // Get external research
  const research = await getExternalResearch(company.companyName);
  
  // Determine recommendation upfront
  const recommendation = determineRecommendation(company);
  console.log('Determined recommendation:', recommendation);

  const prompt = createStructuredPrompt(company, research);
  console.log('Generated prompt for OpenAI');

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Analysis attempt ${attempts} for ${company.companyName}`);

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
              content: 'You are a precise VC analyst. Follow the template exactly. Use specific figures from the data provided. Be decisive and specific.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Lower temperature for more consistent responses
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('No JSON found in response, retrying...');
        continue;
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      const result: AnalysisResult = {
        recommendation,
        timingBucket: recommendation.includes('Decline') ? 'Decline' : 
                     recommendation.includes('Bridge') ? 'Bridge Capital Only' :
                     recommendation.includes('Hold') ? 'Hold (3-6 Months)' : 'Reinvest (3-12 Months)',
        reasoning: analysis.reasoning || 'Analysis incomplete',
        confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
        keyRisks: analysis.keyRisks || 'Risk assessment incomplete',
        suggestedAction: analysis.suggestedAction || 'Conduct further analysis',
        externalSources: `${research.fundingHistory}, ${research.teamGrowth}`,
        insufficientData: false
      };

      // Validate response quality
      if (await validateResponse(result, company)) {
        console.log('High-quality response generated for:', company.companyName);
        return result;
      } else {
        console.log(`Response quality insufficient, retrying (attempt ${attempts})`);
        continue;
      }

    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }

  // Fallback if all attempts fail
  console.log('All attempts failed, returning fallback response');
  return {
    recommendation,
    timingBucket: 'Hold (3-6 Months)',
    reasoning: `Based on ${company.revenueGrowth}% revenue growth and ${company.burnMultiple}x burn multiple, analysis indicates measured approach warranted given current metrics.`,
    confidence: 2,
    keyRisks: 'Technical analysis limitations; recommend manual review of financial performance and market positioning.',
    suggestedAction: 'Schedule management presentation to review detailed financial metrics and growth strategy.',
    externalSources: 'Analysis system limitations',
    insufficientData: false
  };
}

export async function analyzePortfolio(
  companies: CompanyData[], 
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<CompanyData[]> {
  console.log('Starting portfolio analysis for', companies.length, 'companies');
  const results: CompanyData[] = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`Analyzing company ${i + 1}/${companies.length}: ${company.companyName}`);
    onProgress?.(((i + 1) / companies.length) * 100);
    
    try {
      const analysis = await analyzeCompanyWithOpenAI(company, apiKey);
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
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Failed to analyze ${company.companyName}:`, error);
      results.push({
        ...company,
        recommendation: 'Analysis failed',
        timingBucket: 'N/A',
        reasoning: 'Technical error prevented analysis completion. Manual review required.',
        confidence: 1,
        keyRisks: 'System limitations prevent risk assessment; recommend immediate manual review.',
        suggestedAction: 'Escalate to investment committee for manual analysis and decision.',
        externalSources: 'Analysis incomplete due to technical issues',
        insufficientData: true
      } as any);
    }
  }
  
  console.log('Portfolio analysis complete');
  return results;
}
