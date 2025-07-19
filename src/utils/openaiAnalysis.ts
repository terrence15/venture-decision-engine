
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
  apiKey: string
): Promise<AnalysisResult> {
  // Enhanced fail-safe logic based on your specifications
  const criticalFields = [
    { field: 'moic', value: company.moic },
    { field: 'revenueGrowth', value: company.revenueGrowth },
    { field: 'burnMultiple', value: company.burnMultiple },
    { field: 'runway', value: company.runway },
    { field: 'tam', value: company.tam },
    { field: 'exitActivity', value: company.exitActivity },
    { field: 'additionalInvestmentRequested', value: company.additionalInvestmentRequested }
  ];
  
  const missingCriticalData = criticalFields.filter(field => 
    field.value === null || field.value === undefined || field.value === '' || field.value === 0
  ).length;
  
  // Fail-safe: If 2+ critical fields are missing, return standardized fallback
  if (missingCriticalData >= 2) {
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

  const prompt = `You are a venture capital investor making live recommendations. You must integrate internal Excel data with verified external market signals in every field — not as a separate section, but within the body of reasoning and risk evaluation.

COMPANY ANALYSIS DATA:
Company: ${company.companyName}
Total Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
Equity Stake: ${company.equityStake}%
Current MOIC: ${company.moic}x
TTM Revenue Growth: ${company.revenueGrowth}%
Burn Multiple: ${company.burnMultiple}x
Runway: ${company.runway} months
TAM Score: ${company.tam}/5
Exit Activity in Sector: ${company.exitActivity}
Barrier to Entry: ${company.barrierToEntry}/5
Additional Investment Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M

RESEARCH REQUIREMENTS:
You must conduct independent external research for each company using verified third-party sources:
- Crunchbase (funding rounds, investor quality, valuation signals)
- LinkedIn (hiring trends, team growth, leadership changes)
- TechCrunch, VentureBeat (funding news, product launches, market coverage)
- PitchBook (exit comps, market positioning)
- Glassdoor (employee sentiment, organizational health)
- Company blog/press releases (strategic updates, partnerships)

SCORING WEIGHTS (for internal model calibration):
- Implied MOIC: 20%
- TTM Revenue Growth: 15% 
- Burn Multiple: 15%
- Runway Post-Investment: 10%
- Exit Activity in Sector: 10%
- TAM: 10%
- Barrier to Entry: 10%
- Fund Dilution Exposure: 10%

UPSIDE SIGNAL GUIDELINES:
- TTM Revenue Growth > 50% YoY = Strong signal
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

OUTPUT INSTRUCTIONS:
Provide your analysis in the following JSON format:

{
  "recommendation": "Specific capital amount decision (e.g., 'Invest $250K of $1M request', 'Invest full $500K', 'Bridge Capital Only - $150K', 'Decline')",
  "timingBucket": "One of: Double Down, Reinvest (3-12 Months), Hold (3-6 Months), Bridge Capital Only, Exit Opportunistically, Decline",
  "reasoning": "2-4 sentences combining internal performance data with external market validation. Structure: Start with internal performance stat (ARR, growth, burn) → Follow with external validation (funding, hiring, product reviews, investor quality) → Flag downside risks (runway, competition, market) → End with investment logic",
  "confidence": "Integer 1-5 where 5=complete internal+strong external validation, 3=solid internal but mixed external, 1=missing data",
  "keyRisks": "1-2 sentences highlighting the most material threat, including at least one external-facing risk (competitor activity, hiring slowdown, category saturation, etc.)",
  "suggestedAction": "1 tactical sentence with specific next step: request updated CAC/LTV, monitor hiring funnel, diligence Series B interest, review cohort retention, etc.",
  "externalSources": "Brief list of research sources used (e.g., 'Crunchbase (funding data), LinkedIn (hiring trends), TechCrunch coverage')"
}

CRITICAL: Each field must cite at least one internal and one external insight — fully blended in the reasoning. Think like a VC partner prioritizing growth-adjusted capital efficiency, exit feasibility, and downside risk.`;

  try {
    console.log(`Analyzing ${company.companyName} with enhanced AI prompting...`);
    
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
            content: 'You are an experienced venture capital investor with deep expertise in portfolio management and capital allocation decisions. You have access to comprehensive business databases and market intelligence. Provide thorough, research-backed investment recommendations that integrate internal performance data with external market signals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
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

    console.log(`Raw AI response for ${company.companyName}:`, content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', content);
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`Parsed analysis for ${company.companyName}:`, analysis);
    
    return {
      recommendation: analysis.recommendation || 'Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold (3-6 Months)',
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: analysis.externalSources || 'Limited external research available',
      insufficientData: false
    };

  } catch (error) {
    console.error(`OpenAI API Error for ${company.companyName}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze company data');
  }
}

export async function analyzePortfolio(
  companies: CompanyData[], 
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<CompanyData[]> {
  const results: CompanyData[] = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const progress = ((i + 1) / companies.length) * 100;
    onProgress?.(progress);
    
    try {
      console.log(`Analyzing company ${i + 1}/${companies.length}: ${company.companyName}`);
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
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
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
  
  return results;
}
