import { conductExternalResearch, getPerplexityApiKey } from './externalResearch';

interface CompanyData {
  id: string;
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  projectedRevenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  industry: string;
  investorInterest: number | null;
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
  revenue?: number;
  monthlyBurn?: number;
  currentValuation?: number;
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
  // Enhanced external attribution
  externalInsights: {
    marketContext: string[];
    competitivePosition: string[];
    fundingEnvironment: string[];
    industryTrends: string[];
  };
  researchQuality: 'comprehensive' | 'limited' | 'minimal' | 'unavailable';
  sourceAttributions: string[];
}

export async function analyzeCompanyWithOpenAI(
  company: CompanyData, 
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<AnalysisResult> {
  console.log('🤖 [OpenAI Analysis] Starting analysis for:', company.companyName);
  
  // Check for insufficient data (fail-safe logic)
  const criticalFields = [
    company.moic,
    company.revenueGrowth,
    company.burnMultiple || company.runway,
    company.tam,
    company.exitActivity,
    company.additionalInvestmentRequested,
    company.investorInterest,
    company.preMoneyValuation,
    company.postMoneyValuation
  ];
  
  const missingCriticalData = criticalFields.filter(field => 
    field === null || field === undefined || field === ''
  ).length;
  
  console.log('📊 [OpenAI Analysis] Missing critical data fields:', missingCriticalData);
  
  if (missingCriticalData >= 2) {
    console.log('⚠️ [OpenAI Analysis] Insufficient data, returning early');
    return {
      recommendation: 'Insufficient data to assess',
      timingBucket: 'N/A',
      reasoning: 'Missing critical inputs (e.g., growth, burn, TAM, exit environment, valuations), which prevents a responsible investment recommendation. Recommend holding until updated data is provided.',
      confidence: 1,
      keyRisks: 'Lack of visibility into company performance, capital efficiency, valuation trajectory, or exit feasibility makes additional investment highly speculative.',
      suggestedAction: 'Request updated financials, capital plan, growth KPIs, and current round valuation data before reassessing capital deployment.',
      externalSources: 'Insufficient internal data - external research not conducted',
      insufficientData: true,
      externalInsights: {
        marketContext: [],
        competitivePosition: [],
        fundingEnvironment: [],
        industryTrends: []
      },
      researchQuality: 'unavailable' as const,
      sourceAttributions: []
    };
  }

  // Conduct external research if Perplexity API key is available and triggers are met
  let externalResearch = '';
  let externalSources = '';
  let research: any = null;
  
  const perplexityKey = getPerplexityApiKey();
  console.log('🔑 [OpenAI Analysis] Perplexity key check:', perplexityKey ? 'FOUND' : 'NOT FOUND');
  
  if (perplexityKey) {
    try {
      console.log('🔍 [OpenAI Analysis] Starting external research with trigger evaluation...');
      onProgress?.(`Researching ${company.companyName}...`);
      
      research = await conductExternalResearch({
        companyName: company.companyName,
        totalInvestment: company.totalInvestment,
        equityStake: company.equityStake,
        additionalInvestmentRequested: company.additionalInvestmentRequested,
        industry: company.industry,
        tam: company.tam,
        revenue: company.revenue,
        burnMultiple: company.burnMultiple,
        exitActivity: company.exitActivity
      }, perplexityKey);
      
      console.log('✅ [OpenAI Analysis] External research completed:', research);
      
      externalResearch = `
EXTERNAL MARKET INTELLIGENCE (${research.researchQuality.toUpperCase()} QUALITY):

STRUCTURED INSIGHTS WITH SOURCE ATTRIBUTION:
Market Context: ${research.structuredInsights.marketContext.map(i => `"${i.insight}" (${i.source})`).join('; ') || 'No market insights available'}

Competitive Position: ${research.structuredInsights.competitivePosition.map(i => `"${i.insight}" (${i.source})`).join('; ') || 'No competitive insights available'}

Funding Environment: ${research.structuredInsights.fundingEnvironment.map(i => `"${i.insight}" (${i.source})`).join('; ') || 'No funding insights available'}

Industry Trends: ${research.structuredInsights.industryTrends.map(i => `"${i.insight}" (${i.source})`).join('; ') || 'No trend insights available'}

Research Sources: ${research.sources.join(', ') || 'Limited external data available'}
      `;
      
      externalSources = research.sources.length > 0 
        ? `Approved research sources: ${research.sources.join(', ')}` 
        : 'External research conducted with limited source availability';
        
    } catch (error) {
      console.error('❌ [OpenAI Analysis] External research failed:', error);
      externalResearch = '\nEXTERNAL RESEARCH: Unable to conduct research from approved sources due to API limitations.';
      externalSources = 'External research failed - API error or source restrictions';
    }
  } else {
    console.log('⚠️ [OpenAI Analysis] No Perplexity key, skipping external research');
    externalResearch = '\nEXTERNAL RESEARCH: Not available - configure Perplexity API key to enable market research from approved sources.';
    externalSources = 'Internal analysis only - external market research requires Perplexity API configuration';
  }

  onProgress?.(`Analyzing ${company.companyName}...`);

  const prompt = `You are an expert venture capital investor evaluating whether to approve an additional capital request from a portfolio company. Your analysis must be grounded in the Excel financial data with external market insights used only as supporting context.

ANALYSIS PROTOCOL:
- Excel financial data is the PRIMARY source of truth for all investment decisions
- External research provides market color and sector context ONLY  
- Never hallucinate or invent market data not provided in external research
- If external data is insufficient, state this explicitly rather than making assumptions
- Integrate approved source insights into reasoning and risk assessment where available

CRITICAL INVESTOR INTEREST LOGIC (GATING VARIABLE):
The "Investor Interest / Ability to Raise Capital" score is NOT a soft modifier - it's a critical feasibility gate that can override positive financial metrics:

CONDITIONAL INVESTMENT RULES:
- IF Investor Interest ≤ 2 AND Additional Investment Requested > $3M:
  * Apply "All-or-Nothing" threshold logic - high risk of stranded capital
  * Consider "Conditional Investment" recommendations (e.g., "Invest $2M only if remaining $8M committed by others within 30 days")
  * Flag "bagholder risk" - we bear disproportionate risk without syndicate support
  * Question: Is our capital catalytic or just hopeful?

- IF Investor Interest = 1 (only us interested):
  * HEAVILY downweight confidence regardless of financial metrics
  * Add "syndicate risk" and "round fragility" to keyRisks
  * Suggest: "Wait for lead investor confirmation" or "Seek co-investors before committing"
  * If use-of-funds is binary (needs full amount), flag as "round unlikely to close"

- IF Investor Interest = 4-5 (competitive/oversubscribed):
  * Increase confidence and support partial commitments
  * Consider rightsizing participation: "Partial participation sufficient in competitive round"
  * Lower urgency to overcommit capital

ROUND FEASIBILITY ASSESSMENT:
- Evaluate if the capital need is modular vs binary (can company succeed with partial funding?)
- If binary funding need + low investor interest = flag as "round fragility risk"
- Apply minimum raise success likelihood: "Would this raise succeed without our anchor?"

PROJECTED REVENUE GROWTH INTEGRATION LOGIC:
The "Projected Revenue Growth (Next 12 Months)" is a critical forward-looking momentum signal that must be weighted against external validation signals:

GROWTH MOMENTUM INTERPRETATION:
- Above 100% = Hyper-growth stage signal (justify larger follow-ons if externally validated)
- Above 50% = Strong forward momentum (positive indicator if supported by market interest)
- Below 25% = Caution flag unless paired with profitability or defensibility
- Must be cross-referenced with TTM performance for credibility assessment

CREDIBILITY VALIDATION RULES:
- High projected growth (>50%) + High investor interest (4-5) = Validate optimistic projections and consider increased investment
- High projected growth (>100%) + Low investor interest (1-2) = RED FLAG - aggressive projections lack external validation, downweight confidence significantly
- Low projected growth (<25%) + High burn multiple = Flag capital efficiency concerns and execution risk

CAPITAL RECOMMENDATION INTEGRATION:
- Use projected growth to justify investment sizing: strong validated growth can support larger commitments
- Flag disconnects: if projections are ambitious but investor interest is low, question if growth targets are realistic
- Consider runway needs: aggressive growth projections require adequate execution timeline and capital efficiency

VALUATION-BASED DECISION FRAMEWORK:
The Pre-Money and Post-Money Valuation data must drive sophisticated capital deployment decisions:

OWNERSHIP & DILUTION ANALYSIS:
- Calculate ownership preservation: Compare current equity stake vs. new round dilution impact
- Assess return compression: Determine required exit valuation for 3x+ returns on new capital at post-money pricing
- Flag overpricing: If markup exceeds growth fundamentals (revenue, market traction), caution against follow-on participation

VALUATION JUSTIFICATION RULES:
- High markup (>2.5x from implied previous round) + Strong growth (>50% TTM + >50% projected) + High investor interest (4-5) = Validate premium pricing
- High markup (>3x) + Weak growth (<25% TTM or projected) + Low investor interest (1-2) = RED FLAG for overpricing, recommend decline
- Reasonable markup (<2x) + Moderate growth + Competitive interest = Support pro-rata or increased participation

STRATEGIC ROUND ANALYSIS:
- Higher post-money valuations create greater exit pressure and strategic risk
- Low-quality rounds at inflated valuations should reduce confidence and flag "deadweight pricing" risk
- Consider if valuation is hype-driven vs. fundamentals-driven based on growth metrics and market validation

RETURN COMPRESSION MATH:
- Calculate new cost basis at post-money valuation
- Determine minimum exit valuation needed for acceptable returns (3x+ target)
- If exit requirements seem unrealistic given TAM and market conditions, flag as overpriced participation

PRIMARY FINANCIAL DATA (REQUIRED BASIS FOR DECISIONS):
Company: ${company.companyName}
Industry: ${company.industry || 'Not specified'}
Total Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
Equity Stake: ${company.equityStake}%
Current MOIC: ${company.moic}x
TTM Revenue Growth: ${company.revenueGrowth !== null ? `${company.revenueGrowth}%` : 'Not provided'}
Projected Revenue Growth (Next 12 Months): ${company.projectedRevenueGrowth !== null ? `${company.projectedRevenueGrowth}%` : 'Not provided'}
Burn Multiple: ${company.burnMultiple !== null ? `${company.burnMultiple}x` : 'Not provided'}
Runway: ${company.runway !== null ? `${company.runway} months` : 'Not provided'}
TAM Score: ${company.tam}/5
Exit Activity in Sector: ${company.exitActivity}
Barrier to Entry: ${company.barrierToEntry}/5
Additional Investment Requested: $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M
Investor Interest / Ability to Raise Capital: ${company.investorInterest !== null ? `${company.investorInterest}/5` : 'Not provided'}
Pre-Money Valuation: ${company.preMoneyValuation !== null ? `$${(company.preMoneyValuation / 1000000).toFixed(1)}M` : 'Not provided'}
Post-Money Valuation: ${company.postMoneyValuation !== null ? `$${(company.postMoneyValuation / 1000000).toFixed(1)}M` : 'Not provided'}

${externalResearch}

CRITICAL REQUIREMENTS:
1. Base capital recommendation primarily on financial metrics above
2. Use external market context to enhance reasoning and risk assessment where available
3. If external data contradicts financial performance, explain discrepancy and prioritize actual company data
4. EXPLICITLY CITE external sources when they influence your decision (use format: "per [Source]")
5. Clearly distinguish between data-driven insights and market-context observations
6. If insufficient external data, acknowledge this limitation explicitly
7. MANDATORY: Factor investor interest level into capital recommendation, confidence score, and suggested actions:
   - Score 1 (only us interested): Higher risk but potential leverage - scrutinize downside carefully
   - Score 2-3 (moderate interest): Standard evaluation based on performance metrics
   - Score 4-5 (oversubscribed/competitive): Consider rightsizing participation, less urgency to overcommit

Provide your analysis in the following JSON format:
{
  "recommendation": "Enhanced recommendations incorporating valuation analysis: 'Invest $X at fair valuation', 'Decline due to overpricing', 'Pro-rata only - valuation stretch', 'Conditional Investment - $X if terms include downside protection', 'Bridge Capital Only - $X pending reasonable valuation', 'Wait for Co-Lead', 'Decline due to syndicate risk', etc.",
  "timingBucket": "Enhanced options: 'Double Down', 'Conditional Investment', 'Bridge Only Pending Syndicate', 'Wait for Co-Lead', 'Reinvest (3-12 Months)', 'Hold (3-6 Months)', 'Exit Opportunistically', 'Decline'",
  "reasoning": "2-4 sentences starting with financial analysis, incorporating CRITICAL valuation assessment (markup vs. growth fundamentals), investor interest, and round feasibility. Must address ownership dilution impact, return compression risk, and whether valuation is justified by traction. Include explicit source citations when external data influences decision.",
  "confidence": "Integer 1-5 where 5=strong financial+reasonable valuation+external validation+high investor interest, 3=solid metrics+fair valuation+moderate interest, 1=overpriced round OR low investor interest (1-2) regardless of other metrics or insufficient data",
  "keyRisks": "1-2 sentences highlighting material threats, MUST include valuation-specific risks like 'return compression from markup', 'overpricing vs. fundamentals', 'exit pressure from high post-money', plus 'syndicate risk', 'round fragility', 'stranded capital risk', or 'bagholder risk' when investor interest ≤ 2 AND capital request > $3M", 
  "suggestedAction": "1 tactical sentence focusing on valuation negotiation, downside protection, syndicate building, co-investor validation, or conditional deployment triggers based on pricing and interest levels",
  "externalSources": "Brief summary of external research quality and limitations",
  "externalInsights": {
    "marketContext": ["List key market insights that influenced analysis"],
    "competitivePosition": ["List competitive insights that influenced analysis"], 
    "fundingEnvironment": ["List funding insights that influenced analysis"],
    "industryTrends": ["List trend insights that influenced analysis"]
  },
  "sourceAttributions": ["List specific sources that were cited in reasoning or risks"]
}

Think like a VC partner prioritizing financial fundamentals while incorporating market intelligence responsibly.`;

  console.log('🤖 [OpenAI Analysis] Sending prompt to OpenAI...');

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
            content: 'You are an experienced venture capital investor with deep expertise in portfolio management and capital allocation decisions. Provide objective, data-driven investment recommendations that integrate both internal performance metrics and external market intelligence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    console.log('🤖 [OpenAI Analysis] OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('🤖 [OpenAI Analysis] OpenAI response content:', content);
    
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('🤖 [OpenAI Analysis] Parsed analysis result:', analysis);
    
    return {
      recommendation: analysis.recommendation || 'Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold (3-6 Months)',
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: externalSources,
      insufficientData: false,
      // Enhanced external attribution
      externalInsights: analysis.externalInsights || {
        marketContext: [],
        competitivePosition: [],
        fundingEnvironment: [],
        industryTrends: []
      },
      researchQuality: research?.researchQuality || 'unavailable',
      sourceAttributions: analysis.sourceAttributions || []
    };

  } catch (error) {
    console.error('❌ [OpenAI Analysis] OpenAI API Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze company data');
  }
}

export async function analyzePortfolio(
  companies: CompanyData[], 
  apiKey: string,
  onProgress?: (progress: number, status?: string) => void
): Promise<CompanyData[]> {
  const results: CompanyData[] = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const baseProgress = (i / companies.length) * 100;
    
    try {
      const analysis = await analyzeCompanyWithOpenAI(company, apiKey, (status) => {
        onProgress?.(baseProgress, status);
      });
      
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
      
      onProgress?.(((i + 1) / companies.length) * 100, `Completed ${company.companyName}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        insufficientData: true,
        externalInsights: {
          marketContext: [],
          competitivePosition: [],
          fundingEnvironment: [],
          industryTrends: []
        },
        researchQuality: 'unavailable' as const,
        sourceAttributions: []
      } as any);
      
      onProgress?.(((i + 1) / companies.length) * 100, `Failed: ${company.companyName}`);
    }
  }
  
  return results;
}
