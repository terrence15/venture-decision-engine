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
  roundComplexity: number | null;
  exitTimeline: number | null;
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
  projectedExitValueRange: string;
  externalSources: string;
  insufficientData: boolean;
  riskAdjustedMonetizationSummary: string;
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
    company.postMoneyValuation,
    company.roundComplexity
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
        projectedExitValueRange: 'Cannot project exit value without sufficient company data. Industry benchmarks and revenue metrics required for analysis.',
        externalSources: 'Insufficient internal data - external research not conducted',
        insufficientData: true,
        riskAdjustedMonetizationSummary: 'Insufficient data to calculate risk-adjusted monetization summary. Core financial metrics, growth projections, and market validation data required to assess projected returns, success probability, and risk-adjusted exit value.',
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

ROUND COMPLEXITY DECISION FRAMEWORK:
The Round Complexity score (1-5) is a critical structural risk factor that directly impacts investment confidence:

COMPLEXITY INTERPRETATION:
- Score 5: Clean, investor-friendly terms with simple preferred equity structure
- Score 4: Standard terms with minor complexities but acceptable structure
- Score 3: Moderate complexity requiring careful review but not prohibitive
- Score 2: High complexity with potentially problematic terms (cram-downs, stacked preferences)
- Score 1: Extremely messy structure with major red flags and governance risks

DECISION IMPACT RULES:
- Complexity 1-2 + Large Investment (>$3M): Flag "structural risk" and reduce confidence regardless of metrics
- Complexity 1-2 + Any request: Require legal review and consider conditional investment only
- Complexity 3: Standard evaluation with yellow flag for term review
- Complexity 4-5: Support streamlined follow-on process with increased confidence
- Missing complexity: Default to 3 but flag need for legal/term review

CONFIDENCE MODIFICATION:
- Complexity 1-2: Cap confidence at 3 maximum, regardless of financial performance
- Complexity 3: No confidence penalty but mention term review requirement
- Complexity 4-5: Potential confidence boost when combined with strong metrics

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
Round Complexity: ${company.roundComplexity !== null ? `${company.roundComplexity}/5` : 'Not provided - defaulting to 3 (neutral)'}
Exit Timeline: ${company.exitTimeline !== null ? `${company.exitTimeline} years` : '3 years (default assumption)'}

${externalResearch}

EXIT TIMELINE INTEGRATION PROTOCOL:
Use the Exit Timeline to drive financial projections and time-sensitive investment decisions:

PROJECTED FINANCIAL CALCULATIONS:
- Projected ARR at Exit = Current ARR × (1 + Revenue Growth Rate) ^ Exit Timeline
- Gross Exit Value = Projected ARR × Industry EV/ARR Multiple (from external research)
- Factor timeline into IRR calculations: longer timelines increase risk and may compress returns

TIME-SENSITIVE RISK ASSESSMENT:
- Longer timelines (>5 years) increase execution risk and market uncertainty
- Factor capital lock-up risk into confidence scoring
- Consider timeline feasibility vs. runway and burn rate
- Assess whether timeline aligns with typical sector exit patterns

CRITICAL REQUIREMENTS:
1. Base capital recommendation primarily on financial metrics above, enhanced by exit timeline projections
2. Use exit timeline for ALL projected financial calculations (ARR, exit value, IRR assessment)
3. Include explicit timeline mentions in reasoning: "based on a ${company.exitTimeline || 3}-year projected exit timeline"
4. Factor timeline into confidence scoring: realistic timelines boost confidence, aggressive timelines reduce it
5. Use external market context to validate timeline assumptions and sector exit patterns
6. If external data contradicts timeline assumptions, explain discrepancy and adjust projections
7. EXPLICITLY CITE external sources when they influence timeline or exit value projections
8. MANDATORY: Factor investor interest level into capital recommendation, confidence score, and suggested actions:
   - Score 1 (only us interested): Higher risk but potential leverage - scrutinize downside carefully
   - Score 2-3 (moderate interest): Standard evaluation based on performance metrics
   - Score 4-5 (oversubscribed/competitive): Consider rightsizing participation, less urgency to overcommit
9. MANDATORY: Factor round complexity into all decisions:
   - Complexity 1-2: Reduce confidence, require legal review, consider declining or conditional investment
   - Complexity 3: Standard evaluation with term review requirement
   - Complexity 4-5: Support increased participation with clean structure confidence boost
10. MANDATORY: Use exit timeline in all commentary sections (reasoning, projectedExitValueRange, suggestedAction)

RISK-ADJUSTED MONETIZATION SUMMARY PROTOCOL:
You MUST calculate the Risk-Adjusted Monetization Summary using this 7-step process:

STEP 1: Project ARR at Exit
Projected ARR at Exit = ARR (TTM) × (1 + Projected Revenue Growth) ^ Exit Timeline
- Use company revenue/ARR data and projected growth rate
- Use Exit Timeline from user input; if blank, default to 3 years

STEP 2: Pull EV/ARR Multiple from External Research
- Extract EV/ARR multiples from external research data (TechCrunch, Crunchbase, market reports)
- Use industry-specific multiples based on stage and sector
- Default to 5-8x range for Series A/B SaaS if no specific data available

STEP 3: Estimate Gross Exit Value
Gross Exit Value = Projected ARR at Exit × Industry EV/ARR Multiple

STEP 4: Assign Composite Success Probability
Calculate risk-weighted probability based on:
- Execution Risk: Burn Multiple, Runway, EBITDA Margin, Revenue Growth
- Market Risk: TAM, Exit Activity in Sector, Barrier to Entry  
- Cap Table Risk: Round Complexity, Investor Interest
Risk Levels: Low (50-70%), Medium (20-40%), High (5-15%)

STEP 5: Calculate Risk-Adjusted Exit
Risk-Adjusted Exit = Gross Exit Value × Success Probability

STEP 6: Estimate VC Return  
VC Return = Risk-Adjusted Exit × Equity Stake %

STEP 7: Risk-Adjusted MOIC
MOIC = VC Return ÷ (Total Investment + Additional Investment Requested)

Provide your analysis in the following JSON format:
{
  "recommendation": "Enhanced recommendations incorporating valuation analysis: 'Invest $X at fair valuation', 'Decline due to overpricing', 'Pro-rata only - valuation stretch', 'Conditional Investment - $X if terms include downside protection', 'Bridge Capital Only - $X pending reasonable valuation', 'Wait for Co-Lead', 'Decline due to syndicate risk', etc.",
  "timingBucket": "Enhanced options: 'Double Down', 'Conditional Investment', 'Bridge Only Pending Syndicate', 'Wait for Co-Lead', 'Reinvest (3-12 Months)', 'Hold (3-6 Months)', 'Exit Opportunistically', 'Decline'",
  "reasoning": "2-4 sentences starting with financial analysis, incorporating CRITICAL valuation assessment (markup vs. growth fundamentals), investor interest, and round feasibility. Must address ownership dilution impact, return compression risk, and whether valuation is justified by traction. Include explicit source citations when external data influences decision.",
  "confidence": "Integer 1-5 where 5=strong financial+clean terms(4-5)+reasonable valuation+external validation+high investor interest, 3=solid metrics+moderate complexity(3)+fair valuation+moderate interest, 1=complex terms(1-2) OR overpriced round OR low investor interest (1-2) regardless of other metrics or insufficient data",
  "keyRisks": "1-2 sentences highlighting material threats, MUST include complexity-specific risks like 'complex deal structure', 'governance alignment issues', 'liquidation preference concerns' for complexity 1-2, plus valuation risks like 'return compression from markup', 'overpricing vs. fundamentals', 'exit pressure from high post-money', plus 'syndicate risk', 'round fragility', 'stranded capital risk', or 'bagholder risk' when investor interest ≤ 2 AND capital request > $3M", 
  "suggestedAction": "1 tactical sentence focusing on complexity management (legal review, term renegotiation for complexity 1-2), valuation negotiation, downside protection, syndicate building, co-investor validation, or conditional deployment triggers based on structure quality, pricing and interest levels",
  "projectedExitValueRange": "1-2 paragraph analysis using EXIT TIMELINE for all projections. Calculate: Projected ARR = Current ARR × (1 + Revenue Growth Rate) ^ ${company.exitTimeline || 3} years, then Gross Exit Value = Projected ARR × Industry EV/ARR Multiple. Compare timeline assumptions against sector norms from external sources. Assess whether ${company.exitTimeline || 3}-year timeline is realistic given current metrics and market conditions. Include dilution impact over the timeline and return compression analysis. State timeline assumption explicitly: 'Based on a ${company.exitTimeline || 3}-year projected exit timeline' and mention if default assumption was used.",
  "riskAdjustedMonetizationSummary": "MANDATORY 1-2 paragraph summary following the 7-step calculation process. Must include: 1) Projected ARR calculation, 2) EV/ARR multiple source and value, 3) Gross Exit Value, 4) Success probability assessment and rationale, 5) Risk-adjusted exit value, 6) VC return calculation, 7) Final risk-adjusted MOIC. Format: 'This company projects a gross exit value of ~$XM based on an ARR forecast of ~$XM over a ${company.exitTimeline || 3}-year timeline and a Xx EV/ARR multiple benchmarked from [source]. However, [risk factors] introduce [risk level] execution risk. We assign a X% success probability. This yields a risk-adjusted exit of ~$XM. With a X% fully diluted stake and $XM total capital exposure, expected return is ~$XM — implying a ~X.Xx risk-adjusted MOIC. [Strategic recommendation].'",
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
      projectedExitValueRange: analysis.projectedExitValueRange || 'Limited external benchmarks available - internal analysis only. Insufficient data for reliable exit value projection.',
      externalSources: externalSources,
      insufficientData: false,
      riskAdjustedMonetizationSummary: analysis.riskAdjustedMonetizationSummary || 'Risk-adjusted monetization analysis could not be completed with available data. Requires comprehensive financial metrics and market validation signals for accurate return projections.',
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
        projectedExitValueRange: analysis.projectedExitValueRange,
        riskAdjustedMonetizationSummary: analysis.riskAdjustedMonetizationSummary,
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
        projectedExitValueRange: 'Cannot project exit value due to analysis failure. Retry analysis or conduct manual evaluation.',
        riskAdjustedMonetizationSummary: 'Risk-adjusted analysis could not be completed due to technical error. Retry analysis to generate comprehensive return projections.',
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
