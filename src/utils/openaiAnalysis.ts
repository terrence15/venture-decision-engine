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
  revenue: number | null;
  arr: number | null;
  caEquityValuation: number | null;
  isExistingInvestment: boolean;
  seriesStage: string | null;
  monthlyBurn?: number;
  currentValuation?: number;
  // Revenue Timeline Fields
  revenueYearMinus2: number | null;
  revenueYearMinus1: number | null;
  currentRevenue: number | null;
  projectedRevenueYear1: number | null;
  projectedRevenueYear2: number | null;
  currentARR: number | null;
  // Calculated Analytics
  yoyGrowthPercent: number | null;
  historicalCAGR2Y: number | null;
  forwardCAGR2Y: number | null;
  forwardRevenueMultiple: number | null;
  revenueTrajectoryScore: number | null;
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
  
  // Enhanced data validation with comprehensive fail-safe checks
  const currentRevenue = company.currentRevenue || company.revenue;
  const currentARR = company.currentARR || company.arr;
  const hasAnyRevenueMetric = (currentRevenue !== null && currentRevenue !== undefined && currentRevenue > 0) ||
                             (currentARR !== null && currentARR !== undefined && currentARR > 0);
  
  const dataValidation = {
    hasRevenue: currentRevenue !== null && currentRevenue !== undefined && currentRevenue > 0,
    hasARR: currentARR !== null && currentARR !== undefined && currentARR > 0,
    hasAnyRevenueMetric,
    hasGrowthData: company.revenueGrowth !== null && company.revenueGrowth !== undefined,
    hasProjectedGrowth: company.projectedRevenueGrowth !== null && company.projectedRevenueGrowth !== undefined,
    hasValuation: company.preMoneyValuation !== null && company.preMoneyValuation !== undefined && 
                  company.postMoneyValuation !== null && company.postMoneyValuation !== undefined,
    hasTimeline: company.exitTimeline !== null && company.exitTimeline !== undefined,
    hasInvestorInterest: company.investorInterest !== null && company.investorInterest !== undefined,
    hasComplexity: company.roundComplexity !== null && company.roundComplexity !== undefined,
    // Fail-safe specific validations
    hasTimelineData: company.revenueYearMinus1 !== null || company.projectedRevenueYear2 !== null,
    canCalculateExitModeling: hasAnyRevenueMetric && 
                             (company.projectedRevenueYear2 !== null && company.projectedRevenueYear2 !== undefined) &&
                             (company.postMoneyValuation !== null && company.postMoneyValuation !== undefined)
  };
  
  console.log('📊 [OpenAI Analysis] Data validation results:', dataValidation);
  
  // Enhanced fail-safe logic for critical data requirements
  const canCalculateExitValue = dataValidation.hasAnyRevenueMetric && 
                               (dataValidation.hasGrowthData || dataValidation.hasTimelineData) && 
                               dataValidation.hasTimeline;
  const canAssessValuation = dataValidation.hasValuation && dataValidation.hasInvestorInterest;
  
  if (!canCalculateExitValue || !canAssessValuation) {
    console.log('⚠️ [OpenAI Analysis] Insufficient data for reliable analysis');
    const missingFields = [];
    if (!dataValidation.hasAnyRevenueMetric) missingFields.push('current revenue or ARR');
    if (!dataValidation.hasGrowthData && !dataValidation.hasTimelineData) missingFields.push('revenue growth or timeline data');
    if (!dataValidation.hasTimeline) missingFields.push('exit timeline');
    if (!dataValidation.hasValuation) missingFields.push('pre/post-money valuation');
    if (!dataValidation.hasInvestorInterest) missingFields.push('investor interest score');
    
    // Enhanced fail-safe response with specific guidance
    const failsafeAction = !dataValidation.canCalculateExitModeling 
      ? "Critical: Provide Projected Revenue +2 and valuation data to enable risk-adjusted analysis"
      : `Provide missing data: ${missingFields.join(', ')}`;
    
    return {
      recommendation: 'Insufficient data: Cannot calculate projected exit value',
      timingBucket: 'N/A - Data Incomplete',
      reasoning: `FAIL-SAFE ANALYSIS: Missing critical fields prevent reliable investment assessment. Required fields: ${missingFields.join(', ')}. Investment decisions require complete financial metrics and market validation signals to avoid speculative commitments.`,
      confidence: 1,
      keyRisks: 'PRIMARY RISK: Data insufficiency creates investment blind spots. Cannot assess growth trajectory, exit feasibility, or valuation reasonableness without complete metrics. High probability of poor investment decisions due to incomplete information.',
      suggestedAction: failsafeAction,
      projectedExitValueRange: 'BLOCKED: Insufficient data to calculate exit value projections. Complete revenue timeline and valuation data required.',
      externalSources: 'External research not conducted due to insufficient internal data foundation',
      insufficientData: true,
      riskAdjustedMonetizationSummary: 'DISABLED: Risk-adjusted analysis requires complete revenue timeline (current + projected +2) and valuation data. Partial data prevents reliable return modeling and success probability assessment.',
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
        revenue: company.revenue || company.arr,
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

NAMED M&A COMPARABLES:
Multiple Type: ${research.structuredInsights.multipleType}
${research.structuredInsights.namedComps.length > 0 ? 
  research.structuredInsights.namedComps.map(comp => 
    `${comp.company} → ${comp.acquirer} (${comp.year}): ${comp.valuation}, ${comp.multiple} (${comp.notes})`
  ).join('\n') : 
  'No specific M&A comparables identified in research'
}

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

  const investmentContext = company.isExistingInvestment 
    ? "You are an expert venture capital investor evaluating whether to approve an additional capital request from an EXISTING PORTFOLIO COMPANY. Focus on performance tracking, exit timing optimization, and portfolio management decisions."
    : "You are an expert venture capital investor evaluating a NEW POTENTIAL INVESTMENT OPPORTUNITY. Focus on investment thesis validation, due diligence priorities, market entry strategy, and initial capital deployment decisions.";

  const prompt = `${investmentContext} Your analysis must be grounded in the Excel financial data with external market insights used only as supporting context.

ANALYSIS PROTOCOL:
- Excel financial data is the PRIMARY source of truth for all investment decisions
- External research provides market color and sector context ONLY  
- Never hallucinate or invent market data not provided in external research
- If external data is insufficient, state this explicitly rather than making assumptions
- Integrate approved source insights into reasoning and risk assessment where available

SERIES/STAGE CONTEXTUAL FRAMING:
${company.seriesStage ? `This company is at the ${company.seriesStage} stage. Use this contextual information to enhance your analysis:` : 'Series/Stage not specified - provide general analysis without stage-specific context.'}

${company.seriesStage ? `STAGE-SPECIFIC INTERPRETATION GUIDELINES FOR ${company.seriesStage.toUpperCase()}:
${company.seriesStage === 'Seed' ? `
- Focus on product-market fit signals, early traction validation, and founder-market fit
- Typical metrics: $0-2M ARR, high growth volatility, limited revenue history
- Investment thesis: Early-stage risk/reward, emphasis on team and market opportunity
- Example context: "For a Seed company with $1M ARR, this $5M raise suggests strong early validation signals"` : 
company.seriesStage === 'Series A' ? `
- Emphasize scalable business model, growth efficiency, and unit economics validation
- Typical metrics: $1-10M ARR, proven growth trajectory, emerging competitive differentiation
- Investment thesis: Growth capital for market expansion, sales/marketing scale-up
- Example context: "For a Series A company with $3M ARR, this $40M raise suggests an ambitious scale-up plan"` :
company.seriesStage === 'Series B' || company.seriesStage === 'Series C' ? `
- Highlight market expansion, operational scaling, and path to profitability clarity
- Typical metrics: $10M+ ARR, established market position, proven business model
- Investment thesis: Expansion capital, geographic/product line growth, market leadership
- Example context: "Series B companies typically see 2-3 year exit timelines; this 6-year plan may indicate structural drag"` :
company.seriesStage === 'Growth' ? `
- Focus on path to profitability, exit readiness, and market leadership consolidation
- Typical metrics: $50M+ ARR, strong unit economics, clear competitive moats
- Investment thesis: Late-stage growth capital, pre-IPO positioning, strategic partnerships
- Example context: "At the Growth stage, an 8x projected revenue multiple is aggressive but not unprecedented in frontier AI"` :
`- Analyze based on available financial metrics without stage-specific assumptions
- Use general venture capital benchmarks and industry standards for evaluation`}

IMPORTANT: This Series/Stage information is for CONTEXTUAL FRAMING ONLY and should NOT:
- Drive automated benchmarks or conditional logic
- Override financial data or calculations  
- Be used as a primary decision factor
- Change core investment methodology

Use Series/Stage to enhance qualitative commentary, provide relevant benchmarks, and add appropriate context to financial analysis.` : ''}

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
Investment Status: ${company.isExistingInvestment ? 'EXISTING PORTFOLIO COMPANY' : 'NEW POTENTIAL INVESTMENT'}
${company.seriesStage ? `Series/Stage: ${company.seriesStage}` : 'Series/Stage: Not specified'}
Industry: ${company.industry || 'Not specified'}
Total Investment to Date: $${(company.totalInvestment / 1000000).toFixed(1)}M
Equity Stake: ${company.equityStake}%
Current MOIC: ${company.moic}x
${company.caEquityValuation !== null ? `CA Equity Valuation: $${(company.caEquityValuation / 1000000).toFixed(1)}M` : ''}

REVENUE TIMELINE ANALYSIS (5-Point Historical and Forward Progression):
${company.revenueYearMinus2 !== null || company.revenueYearMinus1 !== null || company.currentRevenue !== null || company.projectedRevenueYear1 !== null || company.projectedRevenueYear2 !== null ?
  `Year -2: ${company.revenueYearMinus2 !== null ? `$${(company.revenueYearMinus2 / 1000000).toFixed(1)}M` : 'N/A'}
Year -1: ${company.revenueYearMinus1 !== null ? `$${(company.revenueYearMinus1 / 1000000).toFixed(1)}M` : 'N/A'}
Current: ${company.currentRevenue !== null ? `$${(company.currentRevenue / 1000000).toFixed(1)}M` : 'N/A'}
Year +1: ${company.projectedRevenueYear1 !== null ? `$${(company.projectedRevenueYear1 / 1000000).toFixed(1)}M` : 'N/A'}
Year +2: ${company.projectedRevenueYear2 !== null ? `$${(company.projectedRevenueYear2 / 1000000).toFixed(1)}M` : 'N/A'}

CALCULATED ANALYTICS WITH FAIL-SAFE STATUS:
YoY Growth: ${company.yoyGrowthPercent !== null ? `${company.yoyGrowthPercent.toFixed(1)}%` : '⚠️ INSUFFICIENT DATA: Missing previous year revenue'}
Historical 2Y CAGR: ${company.historicalCAGR2Y !== null ? `${company.historicalCAGR2Y.toFixed(1)}%` : '⚠️ SKIP: Year -2 revenue not available'}
Forward 2Y CAGR: ${company.forwardCAGR2Y !== null ? `${company.forwardCAGR2Y.toFixed(1)}%` : '⚠️ PROJECTION NOT AVAILABLE: Missing Year +2 revenue'}
Forward Revenue Multiple (Exit Val/Rev+2): ${company.forwardRevenueMultiple !== null ? `${company.forwardRevenueMultiple.toFixed(1)}x` : '🚫 DISABLED: Risk-adjusted outputs require Projected +2 Revenue'}
Revenue Trajectory Score: ${company.revenueTrajectoryScore !== null ? `${company.revenueTrajectoryScore}/5` : '⚠️ LOW CONFIDENCE: Incomplete data prevents scoring'}

FAIL-SAFE DATA QUALITY ASSESSMENT:
- Data Completeness: ${dataValidation.hasTimelineData ? 'Partial timeline data available' : 'No timeline progression data'}
- Critical Missing: ${!dataValidation.canCalculateExitModeling ? '🚫 Exit modeling BLOCKED (missing Projected +2 Revenue)' : '✅ Exit modeling enabled'}
- Analysis Confidence: ${dataValidation.hasAnyRevenueMetric && dataValidation.hasTimelineData ? 'MEDIUM - Proceed with caution' : 'LOW - High risk of speculative analysis'}` :
  'Timeline data not available - using legacy single-point revenue metrics below'}

LEGACY REVENUE METRICS (for compatibility):
Revenue: ${company.revenue !== null ? `$${(company.revenue / 1000000).toFixed(1)}M` : 'Not provided'}
ARR: ${company.arr !== null ? `$${(company.arr / 1000000).toFixed(1)}M` : 'Not provided'}
Current ARR: ${company.currentARR !== null ? `$${(company.currentARR / 1000000).toFixed(1)}M` : 'Not provided'}
TTM Revenue Growth: ${company.revenueGrowth !== null ? `${company.revenueGrowth}%` : 'Not provided'}
Projected Revenue Growth (Next 12 Months): ${company.projectedRevenueGrowth !== null ? `${company.projectedRevenueGrowth}%` : 'Not provided'}

OTHER FINANCIAL METRICS:
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

REVENUE TIMELINE DECISION FRAMEWORK:
${company.revenueYearMinus2 !== null || company.revenueYearMinus1 !== null || company.projectedRevenueYear1 !== null || company.projectedRevenueYear2 !== null ?
  `TIMELINE-BASED ANALYSIS MODE:
Use the 5-point revenue timeline for comprehensive trajectory assessment. Apply these decision rules:

1. GROWTH TREND EVALUATION:
- Compare Year -2 → -1 → Current → +1 → +2 progression
- Label as "Accelerating", "Stagnating", or "Volatile" based on pattern
- Validate that projections (+1, +2) are realistic given historical performance

2. CREDIBILITY VALIDATION:
- If Forward CAGR > 2x Historical CAGR: Flag "projection credibility risk"
- If High projected growth + Low investor interest: RED FLAG for overoptimistic projections
- If Flat historical growth + Aggressive projections: Question execution capability

3. EXIT VALUE MODELING:
- Use Year +2 Revenue for exit calculations: Projected Exit Value = Revenue+2 × Industry Multiple
- Factor timeline into IRR: ${company.exitTimeline || 3} years to exit affects risk-adjusted returns
- If Forward Revenue Multiple > 30x: Flag "valuation requires high exit premium"

4. TRAJECTORY SCORE INTEGRATION:
- Trajectory Score ${company.revenueTrajectoryScore !== null ? `(${company.revenueTrajectoryScore}/5)` : '(not calculated)'} reflects growth consistency and credibility
- Scores ≤2: High execution risk, reduce confidence
- Scores ≥4: Strong momentum, support increased investment` :
  
  `LEGACY SINGLE-POINT ANALYSIS MODE:
Timeline data unavailable - using traditional revenue/ARR metrics with reduced confidence in projections.
${company.arr !== null && company.revenue !== null ? 
    `Both ARR ($${(company.arr / 1000000).toFixed(1)}M) and Revenue ($${(company.revenue / 1000000).toFixed(1)}M) provided. For SaaS/subscription models, prioritize ARR.` :
    company.arr !== null ? 
      `ARR-based analysis: Use $${(company.arr / 1000000).toFixed(1)}M ARR for calculations.` :
      company.revenue !== null ? 
        `Revenue-based analysis: Use $${(company.revenue / 1000000).toFixed(1)}M total revenue for calculations.` :
        'No revenue metrics provided - cannot calculate exit value projections.'
  }
LIMITATION: Without timeline data, projections will have lower confidence scores due to inability to validate growth patterns.`
}

${externalResearch}

EXIT TIMELINE INTEGRATION PROTOCOL:
Use the Exit Timeline to drive financial projections and time-sensitive investment decisions:

PROJECTED FINANCIAL CALCULATIONS:
- IF ARR PROVIDED: Projected ARR at Exit = Current ARR × (1 + Revenue Growth Rate) ^ Exit Timeline
- IF REVENUE PROVIDED: Projected Revenue at Exit = Current Revenue × (1 + Revenue Growth Rate) ^ Exit Timeline  
- Gross Exit Value = Projected ARR × Industry EV/ARR Multiple OR Projected Revenue × Industry EV/Revenue Multiple (from external research)
- Factor timeline into IRR calculations: longer timelines increase risk and may compress returns
- SPECIFY which metric (ARR vs Revenue) is being used in all exit value calculations

REQUIRED OUTPUT FORMAT FOR EXIT VALUE CALCULATIONS:
You MUST show explicit calculations in your projectedExitValueRange and riskAdjustedMonetizationSummary responses:

FORMAT EXAMPLE:
"Current ARR: $5.0M | Projected ARR (3 years, 80% growth): $5.0M × (1.8)³ = $29.2M | Industry Multiple: 12x EV/ARR (based on MosaicML 12x, Databricks 10-15x range) | Gross Exit Value: $29.2M × 12x = $350M | Risk-Adjusted (70% success): $245M"

OR for Revenue-based:
"Current Revenue: $8.0M | Projected Revenue (3 years, 60% growth): $8.0M × (1.6)³ = $32.8M | Industry Multiple: 8x EV/Revenue (based on Figma 8x, Canva 6-10x range) | Gross Exit Value: $32.8M × 8x = $262M | Risk-Adjusted (80% success): $210M"

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

STEP 2: Pull Industry-Appropriate Multiple from External Research
- Use the Multiple Type (${research?.structuredInsights?.multipleType || 'EV/Revenue'}) identified in external research
- Extract ${research?.structuredInsights?.multipleType || 'EV/Revenue'} multiples from external research data and named comparables
- For ${company.industry || 'this industry'}: Use industry-specific multiples based on business model
- Cite specific comparables when available: ${research?.structuredInsights?.namedComps?.length > 0 ? 
    research.structuredInsights.namedComps.map(c => `${c.company} (${c.multiple})`).join(', ') : 
    'Use general industry benchmarks if no specific comps available'}

STEP 3: Estimate Gross Exit Value
Gross Exit Value = Projected ${research?.structuredInsights?.multipleType?.includes('ARR') ? 'ARR' : 'Revenue'} at Exit × Industry ${research?.structuredInsights?.multipleType || 'EV/Revenue'} Multiple

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
  "recommendation": "${company.isExistingInvestment 
    ? "Enhanced portfolio management recommendations: 'Double Down - increase position', 'Pro-rata Only - maintain ownership', 'Bridge Capital - extend runway', 'Exit Opportunistically', 'Hold - avoid follow-on', 'Conditional Follow-on - if syndicate secured', etc." 
    : "Enhanced new investment recommendations: 'Invest $X - strong thesis', 'Pass - insufficient traction', 'Monitor - revisit in 6 months', 'Due Diligence Required', 'Conditional Term Sheet - pending validation', 'Wait for better entry point', etc."}",
  "timingBucket": "Enhanced options: 'Double Down', 'Conditional Investment', 'Bridge Only Pending Syndicate', 'Wait for Co-Lead', 'Reinvest (3-12 Months)', 'Hold (3-6 Months)', 'Exit Opportunistically', 'Decline'",
  "reasoning": "2-4 sentences starting with financial analysis, incorporating CRITICAL valuation assessment (markup vs. growth fundamentals), investor interest, and round feasibility. Must address ownership dilution impact, return compression risk, and whether valuation is justified by traction. Include explicit source citations when external data influences decision.",
  "confidence": "Integer 1-5 where 5=strong financial+clean terms(4-5)+reasonable valuation+external validation+high investor interest, 3=solid metrics+moderate complexity(3)+fair valuation+moderate interest, 1=complex terms(1-2) OR overpriced round OR low investor interest (1-2) regardless of other metrics or insufficient data",
  "keyRisks": "1-2 sentences highlighting material threats, MUST include complexity-specific risks like 'complex deal structure', 'governance alignment issues', 'liquidation preference concerns' for complexity 1-2, plus valuation risks like 'return compression from markup', 'overpricing vs. fundamentals', 'exit pressure from high post-money', plus 'syndicate risk', 'round fragility', 'stranded capital risk', or 'bagholder risk' when investor interest ≤ 2 AND capital request > $3M", 
  "suggestedAction": "1 tactical sentence focusing on complexity management (legal review, term renegotiation for complexity 1-2), valuation negotiation, downside protection, syndicate building, co-investor validation, or conditional deployment triggers based on structure quality, pricing and interest levels",
  "projectedExitValueRange": "REQUIRED EXPLICIT CALCULATION FORMAT: 'Current ARR: $X.XM | Projected ARR (${company.exitTimeline || 3} years, X% growth): $X.XM × (1.X)^${company.exitTimeline || 3} = $X.XM | Industry Multiple: Xx EV/ARR (based on [named companies with multiples from external research]) | Gross Exit Value: $X.XM × Xx = $XXXM | Risk-Adjusted (X% success): $XXXM'. Use ARR if available, otherwise Revenue. MUST show the actual math calculation and cite specific companies and their multiples from external research. Compare timeline assumptions against sector norms.",
  "riskAdjustedMonetizationSummary": "REQUIRED STEP-BY-STEP CALCULATION FORMAT: Start with explicit revenue projection: 'Current [ARR/Revenue]: $X.XM → Projected [ARR/Revenue] (${company.exitTimeline || 3} years, X% growth): $X.XM × (1.X)^${company.exitTimeline || 3} = $X.XM'. Then apply industry multiple: 'Industry Multiple: Xx EV/[ARR/Revenue] from [specific named companies and their multiples from external research] → Gross Exit Value: $X.XM × Xx = $XXXM'. Then apply risk assessment: 'Success Probability: X% (rationale based on execution, market, cap table risks) → Risk-Adjusted Exit: $XXXM × X% = $XXXM'. Finally calculate returns: 'VC Return: $XXXM × X% equity = $XXM → MOIC: $XXM ÷ $XM total investment = X.Xx'. Must show ALL math steps explicitly.",
  "externalSources": "Brief summary of external research quality and limitations",
  "externalInsights": {
    "marketContext": ["List key market insights that influenced analysis"],
    "competitivePosition": ["List competitive insights that influenced analysis"], 
    "fundingEnvironment": ["List funding insights that influenced analysis"],
    "industryTrends": ["List trend insights that influenced analysis"]
  },
  "sourceAttributions": ["List specific sources that were cited in reasoning or risks"]
}

MANDATORY FAIL-SAFE RESPONSE REQUIREMENTS:
🔴 CRITICAL FIELD MISSING RESPONSES:
- If Projected Revenue +2 missing → Include: "⚠️ RISK-ADJUSTED ANALYSIS DISABLED: Missing Projected Revenue +2 prevents exit value modeling, forward MOIC calculations, and success probability assessment."
- If Current Revenue missing → Include: "🚫 INSUFFICIENT DATA: Current revenue/ARR missing prevents all growth calculations."
- If Year -1 Revenue missing → Include: "⚠️ Unable to calculate YoY Growth: Previous year revenue data required."

🟡 CONFIDENCE DEGRADATION RULES:
- Missing Projected +2: Cap confidence at 3 maximum
- Missing 2+ critical fields: Cap confidence at 2 maximum  
- Missing Current Revenue: Force confidence to 1

🟢 REQUIRED DISCLAIMERS:
- Any missing timeline data → Add: "Revenue trajectory limited by missing historical/projected data; outputs are directional only."
- Missing exit modeling capability → Add: "Risk-adjusted monetization disabled due to insufficient projection data."

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
        max_tokens: 2500,
      }),
    });

    console.log('🤖 [OpenAI Analysis] OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OpenAI Analysis] API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('📄 [OpenAI Analysis] Response length:', content?.length || 0);
    console.log('📄 [OpenAI Analysis] Response preview:', content?.substring(0, 200) + '...' || 'No content');
    
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    // Check for truncated response
    if (!content.trim().endsWith('}')) {
      console.warn('⚠️ [OpenAI Analysis] Response appears truncated');
      throw new Error('OpenAI response was truncated - incomplete JSON data received');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ [OpenAI Analysis] No JSON found in response:', content);
      throw new Error('Could not find valid JSON in OpenAI response');
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      console.log('✅ [OpenAI Analysis] Successfully parsed analysis');
    } catch (parseError) {
      console.error('❌ [OpenAI Analysis] JSON parsing failed:', parseError);
      console.error('❌ [OpenAI Analysis] Raw JSON:', jsonMatch[0]);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
    
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
