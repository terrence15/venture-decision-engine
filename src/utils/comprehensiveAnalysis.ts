
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

// Minimum Viable Inputs (MVI) check
function checkMinimumViableInputs(company: CompanyData): boolean {
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
  ).length;
  
  return missingFields < 2; // Fail if 2+ critical fields missing
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
  
  console.log(`Starting comprehensive analysis for ${company.companyName}...`);
  
  // Step 1: Check Minimum Viable Inputs
  if (!checkMinimumViableInputs(company)) {
    console.log(`Insufficient data for ${company.companyName}, returning fallback response`);
    return generateFallbackResponse();
  }

  // Step 2: Conduct External Research (if Perplexity API available)
  let externalResearch = null;
  if (perplexityApiKey) {
    try {
      externalResearch = await conductExternalResearch(company.companyName, perplexityApiKey);
    } catch (error) {
      console.error(`External research failed for ${company.companyName}:`, error);
    }
  }

  // Step 3: Build comprehensive prompt with Excel data integration
  const prompt = `You are a venture capital investor making live recommendations. You must integrate internal Excel data with verified external market signals in every field.

COMPANY: ${company.companyName}

INTERNAL EXCEL DATA:
- Total Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
- Equity Stake (Fully Diluted): ${company.equityStake}%
- Implied MOIC: ${company.moic}x
- TTM Revenue Growth: ${company.revenueGrowth}%
- ARR (TTM): ${company.arrTtm ? `$${(company.arrTtm / 1000000).toFixed(1)}M` : 'Not Available'}
- Burn Multiple: ${company.burnMultiple}x
- Runway: ${company.runway} months
- EBITDA Margin: ${company.ebitdaMargin ? `${company.ebitdaMargin}%` : 'Not Available'}
- TAM Rating: ${company.tam}/5
- Exit Activity in Sector: ${company.exitActivity}
- Barrier to Entry: ${company.barrierToEntry}/5
- Top 5 Industry Performer: ${company.topPerformer ? 'Yes' : 'No'}
- Additional Investment Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M

${externalResearch ? `
EXTERNAL RESEARCH DATA:
- Funding Intelligence: ${externalResearch.fundingData}
- Hiring Trends: ${externalResearch.hiringTrends}
- Market Positioning: ${externalResearch.marketPositioning}
- Recent News: ${externalResearch.recentNews}
- Competitor Activity: ${externalResearch.competitorActivity}
- Research Sources: ${externalResearch.sources.join(', ')}
` : 'EXTERNAL RESEARCH: Limited external data available'}

SCORING WEIGHTS (Internal Model):
- Implied MOIC: 20%
- TTM Revenue Growth: 15%
- Burn Multiple: 15%
- Runway Post-Investment: 10%
- Exit Activity in Sector: 10%
- TAM: 10%
- Barrier to Entry: 10%
- Fund Dilution Exposure: 10%

UPSIDE SIGNAL GUIDELINES:
- TTM Revenue Growth > 50% YoY = Strong
- TAM Score 4-5 = Large/Expanding market
- Exit Activity "High" or "Moderate + recent comps" = Favorable
- MOIC > 1.7x = Attractive
- Burn Multiple < 1.5x = Efficient
- Barrier to Entry ≥ 4 = Defensible moat

DOWNSIDE RISK GUIDELINES:
- Burn Multiple > 2.5x = Inefficient
- Runway < 6 months = Concerning
- Exit Activity "Low" with no peer comps = Weak
- TTM Growth < 25% YoY = Weak
- Equity Stake < 5% = Dilution risk

MANDATORY OUTPUT FORMAT - Follow this structure exactly:

{
  "recommendation": "Specific capital amount decision (e.g., 'Invest $250K of $1M request', 'Invest full $500K', 'Bridge Capital Only - $150K', 'Decline')",
  "timingBucket": "One of: Double Down, Reinvest (3-12 Months), Hold (3-6 Months), Bridge Capital Only, Exit Opportunistically, Decline",
  "reasoning": "MUST follow 4-part structure: (1) Start with internal performance stat using actual Excel data (ARR, growth %, burn multiple), (2) Follow with external validation from research (funding, hiring, reviews), (3) Flag specific downside risks (runway, competition, market), (4) End with investment logic and specific capital amount justification",
  "confidence": "Integer 1-5 where 5=complete internal+strong external validation, 3=solid internal but mixed external, 1=missing data",
  "keyRisks": "Must include at least 1 external-facing risk from research (competitor activity, hiring issues, market saturation, etc.)",
  "suggestedAction": "Tactical + specific next step: request updated CAC/LTV, monitor hiring funnel, diligence Series B interest, review cohort retention, etc.",
  "externalSources": "List actual research sources used: Crunchbase, LinkedIn, TechCrunch, etc."
}

CRITICAL REQUIREMENTS:
1. Use EXACT figures from Excel data in reasoning (don't approximate)
2. Cite specific external research findings if available
3. Each field must blend internal Excel data WITH external insights
4. Capital recommendation must specify exact dollar amounts
5. Confidence score based on data completeness AND external validation strength

Generate investment recommendation now:`;

  try {
    console.log(`Sending comprehensive analysis request for ${company.companyName}...`);
    
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
            content: 'You are an experienced venture capital partner with deep expertise in portfolio management. You have access to comprehensive business databases and must provide investment recommendations that integrate internal performance data with external market signals. Always follow the exact output format specified and use precise figures from the provided data.'
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
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    console.log(`Raw comprehensive analysis for ${company.companyName}:`, content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', content);
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`Parsed comprehensive analysis for ${company.companyName}:`, analysis);
    
    return {
      recommendation: analysis.recommendation || 'Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold (3-6 Months)',
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: analysis.externalSources || (externalResearch?.sources.join(', ') || 'Limited external research available'),
      insufficientData: false
    };

  } catch (error) {
    console.error(`Comprehensive Analysis Error for ${company.companyName}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze company data');
  }
}
