import { conductExternalResearch, getPerplexityApiKey } from './externalResearch';

// Enhanced Scoring Functions
function calculateMarketCredibilityScore(company: CompanyData): number {
  let score = 0;
  
  // TAM Score (20 points)
  score += (company.tam / 5) * 20;
  
  // Exit Activity (15 points)
  const exitActivityScore = (() => {
    if (company.exitActivity.toLowerCase().includes('high')) return 15;
    if (company.exitActivity.toLowerCase().includes('moderate')) return 10;
    if (company.exitActivity.toLowerCase().includes('low')) return 5;
    return 7; // Default moderate
  })();
  score += exitActivityScore;
  
  // Industry validation (15 points) - based on barrier to entry
  score += (company.barrierToEntry / 5) * 15;
  
  // Investor Interest (10 points)
  if (company.investorInterest !== null) {
    score += (company.investorInterest / 5) * 10;
  } else {
    score += 5; // Default moderate
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateCapitalEfficiencyScore(company: CompanyData): number {
  let score = 0;
  
  // Burn Multiple (30 points)
  if (company.burnMultiple !== null) {
    if (company.burnMultiple <= 1.5) score += 30;
    else if (company.burnMultiple <= 3) score += 20;
    else if (company.burnMultiple <= 5) score += 10;
    else score += 5;
  } else {
    score += 15; // Default moderate
  }
  
  // Runway (20 points)
  if (company.runway !== null) {
    if (company.runway >= 18) score += 20;
    else if (company.runway >= 12) score += 15;
    else if (company.runway >= 6) score += 10;
    else score += 5;
  } else {
    score += 10; // Default moderate
  }
  
  // Revenue growth efficiency (25 points)
  if (company.forwardCAGR2Y !== null && company.burnMultiple !== null) {
    const growthEfficiency = company.forwardCAGR2Y / company.burnMultiple;
    if (growthEfficiency >= 50) score += 25;
    else if (growthEfficiency >= 30) score += 20;
    else if (growthEfficiency >= 15) score += 15;
    else if (growthEfficiency >= 5) score += 10;
    else score += 5;
  } else {
    score += 12; // Default moderate
  }
  
  // MOIC (25 points)
  if (company.moic !== null) {
    if (company.moic >= 3) score += 25;
    else if (company.moic >= 2) score += 20;
    else if (company.moic >= 1.5) score += 15;
    else if (company.moic >= 1) score += 10;
    else score += 5;
  } else {
    score += 12; // Default moderate
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateExecutionCredibilityScore(company: CompanyData): number {
  let score = 0;
  
  // Growth consistency (30 points)
  if (company.historicalCAGR2Y !== null && company.forwardCAGR2Y !== null) {
    const growthRatio = company.forwardCAGR2Y / Math.max(company.historicalCAGR2Y, 1);
    if (growthRatio <= 1.5) score += 30; // Conservative projections
    else if (growthRatio <= 2.5) score += 25; // Reasonable stretch
    else if (growthRatio <= 4) score += 15; // Aggressive but possible
    else score += 5; // Hockey stick risk
  } else {
    score += 15; // Default moderate
  }
  
  // Projection realism (25 points) - Revenue trajectory score
  if (company.revenueTrajectoryScore !== null) {
    score += (company.revenueTrajectoryScore / 5) * 25;
  } else {
    score += 12; // Default moderate
  }
  
  // Historical performance (25 points) - YoY growth
  if (company.yoyGrowthPercent !== null) {
    if (company.yoyGrowthPercent >= 100) score += 25;
    else if (company.yoyGrowthPercent >= 50) score += 20;
    else if (company.yoyGrowthPercent >= 25) score += 15;
    else if (company.yoyGrowthPercent >= 0) score += 10;
    else score += 5;
  } else {
    score += 12; // Default moderate
  }
  
  // Round complexity (20 points) - Lower complexity = higher execution credibility
  if (company.roundComplexity !== null) {
    score += (company.roundComplexity / 5) * 20;
  } else {
    score += 12; // Default moderate (3/5)
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateScenarios(company: CompanyData, marketCredibilityScore: number, capitalEfficiencyScore: number, executionCredibilityScore: number) {
  const currentRevenue = company.currentRevenue || company.revenue || company.arr || company.currentARR || 0;
  const exitTimeline = company.exitTimeline || 3;
  const equityStake = company.equityStake / 100;
  const totalInvestment = company.totalInvestment + (company.additionalInvestmentRequested || 0);
  
  // Base growth rate
  const baseGrowthRate = company.forwardCAGR2Y || company.projectedRevenueGrowth || 50;
  
  // Industry multiple estimate (default to 6x revenue)
  const baseMultiple = 6;
  
  // Calculate scenarios
  const bearGrowthRate = baseGrowthRate * 0.5;
  const baseGrowthRateValue = baseGrowthRate;
  const bullGrowthRate = baseGrowthRate * 1.5;
  
  const bearMultiple = baseMultiple * 0.7;
  const baseMultipleValue = baseMultiple;
  const bullMultiple = baseMultiple * 1.3;
  
  // Project revenue at exit
  const bearRevenue = currentRevenue * Math.pow(1 + bearGrowthRate / 100, exitTimeline);
  const baseRevenue = currentRevenue * Math.pow(1 + baseGrowthRateValue / 100, exitTimeline);
  const bullRevenue = currentRevenue * Math.pow(1 + bullGrowthRate / 100, exitTimeline);
  
  // Calculate exit values
  const bearExitValue = bearRevenue * bearMultiple;
  const baseExitValue = baseRevenue * baseMultipleValue;
  const bullExitValue = bullRevenue * bullMultiple;
  
  // Calculate MOIC
  const bearMOIC = (bearExitValue * equityStake) / totalInvestment;
  const baseMOIC = (baseExitValue * equityStake) / totalInvestment;
  const bullMOIC = (bullExitValue * equityStake) / totalInvestment;
  
  // Assign probabilities based on scores
  const avgScore = (marketCredibilityScore + capitalEfficiencyScore + executionCredibilityScore) / 3;
  const bearProb = avgScore < 40 ? 0.6 : avgScore < 60 ? 0.4 : 0.2;
  const bullProb = avgScore > 80 ? 0.3 : avgScore > 60 ? 0.2 : 0.1;
  const baseProb = 1 - bearProb - bullProb;
  
  return {
    bear: { exitValue: bearExitValue, ownership: equityStake * 100, moic: bearMOIC, probability: bearProb },
    base: { exitValue: baseExitValue, ownership: equityStake * 100, moic: baseMOIC, probability: baseProb },
    bull: { exitValue: bullExitValue, ownership: equityStake * 100, moic: bullMOIC, probability: bullProb }
  };
}

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
  totalRaiseRequest: number | null;
  amountRequestedFromFirm: number | null;
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
  // Enhanced scoring system
  marketCredibilityScore: number;
  capitalEfficiencyScore: number;
  executionCredibilityScore: number;
  // Executive dashboard
  executiveSummary: {
    valuationAssessment: string;
    capitalEfficiency: string;
    marketValidation: string;
    executionRisk: string;
    recommendedAction: string;
  };
  // Scenario analysis
  scenarios: {
    bear: { exitValue: number; ownership: number; moic: number; probability: number };
    base: { exitValue: number; ownership: number; moic: number; probability: number };
    bull: { exitValue: number; ownership: number; moic: number; probability: number };
  };
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
  
  // Enhanced data validation with graduated fail-safe checks
  const currentRevenue = company.currentRevenue || company.revenue;
  const currentARR = company.currentARR || company.arr;
  
  // Fix revenue detection logic - separate null/undefined from zero values
  const hasRevenueField = currentRevenue !== null && currentRevenue !== undefined;
  const hasARRField = currentARR !== null && currentARR !== undefined;
  const hasAnyRevenueAnchor = hasRevenueField || hasARRField;
  
  // Determine revenue data quality for graduated analysis
  const revenueDataQuality = (() => {
    if (!hasAnyRevenueAnchor) return 'missing';
    if (hasRevenueField && hasARRField && 
        company.projectedRevenueYear1 !== null && company.projectedRevenueYear2 !== null) return 'complete';
    if (company.projectedRevenueYear1 !== null || company.projectedRevenueYear2 !== null) return 'partial';
    if (hasAnyRevenueAnchor) return 'projections-only';
    return 'missing';
  })();
  
  // Determine exit modeling capability
  const canDoExitModeling = (() => {
    if (hasAnyRevenueAnchor && company.projectedRevenueYear1 && company.projectedRevenueYear2 && 
        company.postMoneyValuation) return 'full';
    if (hasAnyRevenueAnchor && company.projectedRevenueYear1 && company.postMoneyValuation) return 'limited';
    return 'blocked';
  })();
  
  const dataValidation = {
    hasRevenue: hasRevenueField,
    hasARR: hasARRField, 
    hasAnyRevenueAnchor,
    revenueDataQuality,
    canDoExitModeling,
    hasGrowthData: company.revenueGrowth !== null && company.revenueGrowth !== undefined,
    hasProjectedGrowth: company.projectedRevenueGrowth !== null && company.projectedRevenueGrowth !== undefined,
    hasValuation: company.preMoneyValuation !== null && company.preMoneyValuation !== undefined && 
                  company.postMoneyValuation !== null && company.postMoneyValuation !== undefined,
    hasTimeline: company.exitTimeline !== null && company.exitTimeline !== undefined,
    hasInvestorInterest: company.investorInterest !== null && company.investorInterest !== undefined,
    hasComplexity: company.roundComplexity !== null && company.roundComplexity !== undefined,
    // Enhanced timeline validations
    hasTimelineData: company.revenueYearMinus1 !== null || company.projectedRevenueYear1 !== null || company.projectedRevenueYear2 !== null,
    confidenceLevel: (() => {
      if (revenueDataQuality === 'complete' && canDoExitModeling === 'full') return 'HIGH CONFIDENCE (5/5)';
      if (revenueDataQuality === 'partial' && canDoExitModeling === 'limited') return 'MEDIUM CONFIDENCE (3/5)';
      if (hasAnyRevenueAnchor && company.projectedRevenueYear1) return 'LIMITED CONFIDENCE (2/5)';
      return 'LOW CONFIDENCE (1/5)';
    })()
  };
  
  console.log('📊 [OpenAI Analysis] Data validation results:', dataValidation);
  
  // Graduated fail-safe logic with tiered analysis capability
  const analysisCapability = (() => {
    if (!dataValidation.hasAnyRevenueAnchor) return 'blocked';
    if (dataValidation.canDoExitModeling === 'full' && dataValidation.hasValuation && dataValidation.hasInvestorInterest) return 'full';
    if (dataValidation.canDoExitModeling === 'limited' && dataValidation.hasValuation) return 'limited';
    return 'partial';
  })();
  
  console.log('📊 [OpenAI Analysis] Analysis capability:', analysisCapability);
  
  // Only block analysis if completely missing revenue anchor
  if (analysisCapability === 'blocked') {
    console.log('⚠️ [OpenAI Analysis] 📊 INCOMPLETE DATA - Providing guided analysis');
    const missingFields = [];
    if (!dataValidation.hasAnyRevenueAnchor) missingFields.push('current revenue or ARR');
    if (!dataValidation.hasGrowthData && !dataValidation.hasTimelineData) missingFields.push('revenue growth or timeline data');
    if (!dataValidation.hasTimeline) missingFields.push('exit timeline');
    if (!dataValidation.hasValuation) missingFields.push('pre/post-money valuation');
    if (!dataValidation.hasInvestorInterest) missingFields.push('investor interest score');
    
    // Graduated guidance based on what's missing
    const specificGuidance = (() => {
      if (!dataValidation.hasAnyRevenueAnchor && !company.projectedRevenueYear2) {
        return "Add current revenue/ARR and projected revenue +2 to enable risk-adjusted analysis";
      }
      if (!dataValidation.hasAnyRevenueAnchor) {
        return "Add current revenue or ARR to enable partial analysis";
      }
      if (dataValidation.canDoExitModeling === 'blocked') {
        return "Add projected revenue +2 to enable exit modeling";
      }
      return `Complete missing data: ${missingFields.slice(0, 2).join(', ')}`;
    })();
    
    // Calculate default scores for incomplete data
    const marketCredibilityScore = calculateMarketCredibilityScore(company);
    const capitalEfficiencyScore = calculateCapitalEfficiencyScore(company);
    const executionCredibilityScore = calculateExecutionCredibilityScore(company);

    return {
      recommendation: '📊 INCOMPLETE DATA - Provide revenue anchor for analysis',
      timingBucket: 'N/A - Data Incomplete',
      reasoning: `📊 INCOMPLETE DATA: Missing critical revenue anchor prevents reliable investment assessment. Required fields: ${missingFields.join(', ')}. Investment decisions require at least current revenue or ARR to evaluate growth trajectory and investment potential.`,
      confidence: 1,
      keyRisks: 'PRIMARY RISK: Data insufficiency creates investment blind spots. Cannot assess growth trajectory, exit feasibility, or valuation reasonableness without revenue metrics. Recommend completing data before investment decision.',
      suggestedAction: specificGuidance,
      projectedExitValueRange: '⚠️ LIMITED ANALYSIS: Revenue anchor required for exit value projections. Add current revenue/ARR to enable partial calculations.',
      externalSources: 'External research not conducted due to insufficient internal data foundation',
      insufficientData: true,
      riskAdjustedMonetizationSummary: '🚧 PARTIAL CALCULATION: Risk-adjusted analysis requires revenue anchor (current revenue or ARR). Partial data limits return modeling capability.',
      marketCredibilityScore,
      capitalEfficiencyScore,
      executionCredibilityScore,
      executiveSummary: {
        valuationAssessment: '⚠️ Incomplete Data',
        capitalEfficiency: `🟡 Score: ${capitalEfficiencyScore}/100`,
        marketValidation: `🟡 Score: ${marketCredibilityScore}/100`,
        executionRisk: `🟡 Score: ${executionCredibilityScore}/100`,
        recommendedAction: '📊 Complete data requirements'
      },
      scenarios: {
        bear: { exitValue: 0, ownership: 0, moic: 0, probability: 0 },
        base: { exitValue: 0, ownership: 0, moic: 0, probability: 0 },
        bull: { exitValue: 0, ownership: 0, moic: 0, probability: 0 }
      },
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

Research Sources: ${research.sources.map(s => s.url ? `[${s.title}](${s.url})` : s.title).join(', ') || 'Limited external data available'}
      `;
      
      externalSources = research.sources.length > 0 
        ? `**External Sources**\n${research.sources.filter(s => s.title && s.title !== 'External research').slice(0, 5).map(s => s.url ? `- [${s.title}](${s.url})` : `- ${s.title}`).join('\n')}` 
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

  // Calculate internal analysis scores
  const marketCredibilityScore = calculateMarketCredibilityScore(company);
  const capitalEfficiencyScore = calculateCapitalEfficiencyScore(company);
  const executionCredibilityScore = calculateExecutionCredibilityScore(company);
  
  // Calculate scenario projections
  const scenarios = calculateScenarios(company, marketCredibilityScore, capitalEfficiencyScore, executionCredibilityScore);

  const investmentContext = company.isExistingInvestment 
    ? "You are an expert venture capital investor evaluating whether to approve an additional capital request from an EXISTING PORTFOLIO COMPANY. Focus on performance tracking, exit timing optimization, and portfolio management decisions."
    : "You are an expert venture capital investor evaluating a NEW POTENTIAL INVESTMENT OPPORTUNITY. Focus on investment thesis validation, due diligence priorities, market entry strategy, and initial capital deployment decisions.";

    const prompt = `You are a sophisticated venture capital analyst conducting an investment evaluation.

COMPANY DATA:
${JSON.stringify(company, null, 2)}

INTERNAL ANALYSIS SCORES:
- Market Credibility: ${marketCredibilityScore}/100 (TAM validation, exit activity, industry positioning)
- Capital Efficiency: ${capitalEfficiencyScore}/100 (burn multiple, runway, growth efficiency)  
- Execution Credibility: ${executionCredibilityScore}/100 (growth consistency, projection realism)

SCENARIO ANALYSIS:
${JSON.stringify(scenarios, null, 2)}

${externalResearch ? `
EXTERNAL RESEARCH CONTEXT:
${externalResearch}
` : ''}

Generate a comprehensive investment analysis that integrates all available data. Your response MUST be structured EXACTLY as follows:

🧠 AI Reasoning
Provide detailed analysis incorporating company fundamentals, growth metrics, and market positioning. Include:
- Current revenue/ARR metrics with historical growth context
- Forward revenue multiple calculation: "Post-Money $X / Year+2 Revenue $Y = Zx forward multiple"
- Sector benchmark comparison: "vs sector median of Xx per [source]"
- Growth trajectory analysis: "Forward 2Y CAGR of X% vs historical Y%" 
- Burn efficiency: "Burn multiple of Xx indicates [operational assessment]"
- Investor interest and round complexity impact on execution risk
- Ownership calculations: "X% pre-round → Y% post-round participation"
- Exit timeline and market activity context

⚠️ Key Risks  
Structure risks thematically with specific quantitative impact:
- Valuation Compression: Include specific multiple scenarios and impact on returns
- Execution Gap: Address projection credibility and scaling challenges  
- Market Positioning: Competitive dynamics and differentiation sustainability
- Capital Requirements: Burn trajectory and additional funding needs
- Exit Environment: Liquidity constraints and buyer landscape

✅ Suggested Action
Provide mathematically justified recommendation including:
- Investment sizing with ownership percentage impact
- MOIC requirements: "At X% ownership, need $Y exit for Zx MOIC"
- Risk mitigation strategies and term protection
- Monitoring milestones and performance tracking
- Follow-on strategy and exit preparation timeline

📈 Projected Exit Value Range
Present scenario analysis in table format showing:
- Bear/Base/Bull revenue projections with explicit growth assumptions
- Exit multiples with sector benchmark justification
- Probability weightings based on execution risk assessment
- Ownership-adjusted returns with MOIC calculations

💰 Risk-Adjusted Monetization Summary  
Include comprehensive return modeling:
- Revenue trajectory: "Current $X → Exit $Y (Z% forward CAGR, W-year timeline)"
- Scenario probability weighting with risk-adjusted expected value
- Dilution-adjusted ownership calculations
- IRR and MOIC projections with sensitivity analysis

Use professional VC language, show specific calculations, reference industry benchmarks, and ensure every input field influences the analysis. Write like a top-tier investment memo.

PRIMARY FINANCIAL DATA (REQUIRED BASIS FOR DECISIONS):
Company: ${company.companyName}
Investment Status: ${company.isExistingInvestment ? 'EXISTING PORTFOLIO COMPANY' : 'NEW POTENTIAL INVESTMENT'}
${company.seriesStage ? `Series/Stage: ${company.seriesStage}` : 'Series/Stage: Not specified'}
Industry: ${company.industry || 'Not specified'}
Total Raise Request: ${company.totalRaiseRequest ? `$${(company.totalRaiseRequest / 1000000).toFixed(1)}M` : 'Not specified'}
Amount Requested from Firm: ${company.amountRequestedFromFirm ? `$${(company.amountRequestedFromFirm / 1000000).toFixed(1)}M` : 'Not specified'}
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

GRADUATED DATA QUALITY ASSESSMENT:
- Revenue Data Quality: ${dataValidation.revenueDataQuality.toUpperCase()}
- Exit Modeling Capability: ${dataValidation.canDoExitModeling.toUpperCase()}
- Analysis Confidence Level: ${dataValidation.confidenceLevel}
- Critical Status: ${dataValidation.canDoExitModeling === 'blocked' ? '🚫 Exit modeling BLOCKED (missing revenue anchor)' : dataValidation.canDoExitModeling === 'limited' ? '⚠️ Exit modeling LIMITED (missing Year +2)' : '✅ Exit modeling FULL'}` :
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

## ENHANCED INTERCONNECTED ANALYSIS REQUIREMENTS

**PHASE 1: Executive Dashboard (Lead with Quantitative Scores)**
Calculate and lead with these composite scores to drive all subsequent analysis:

🧮 Market Credibility Score (0-100):
- TAM validation (20pts): (TAM/5) × 20
- Exit Activity (15pts): High=15, Moderate=10, Low=5
- Industry validation (15pts): (Barrier to Entry/5) × 15
- Investor Interest (10pts): (Interest/5) × 10

💰 Capital Efficiency Score (0-100):
- Burn Multiple (30pts): ≤1.5=30, ≤3=20, ≤5=10, >5=5
- Runway (20pts): ≥18mo=20, ≥12mo=15, ≥6mo=10, <6mo=5
- Growth Efficiency (25pts): Forward CAGR ÷ Burn Multiple ratio scoring
- Current MOIC (25pts): ≥3x=25, ≥2x=20, ≥1.5x=15, ≥1x=10, <1x=5

⚡ Execution Credibility Score (0-100):
- Growth Consistency (30pts): Forward/Historical CAGR ratio (lower = better)
- Projection Realism (25pts): Revenue trajectory score basis
- Historical Performance (25pts): YoY growth rate scoring
- Structural Complexity (20pts): Round complexity inversion

**PHASE 2: Revenue Consistency Validation**
MANDATORY cross-checks that must influence confidence scoring:
- ARR vs Revenue sanity (flag if ARR >> Revenue by >20%)
- Hockey-stick detection (flag if Forward CAGR >> Historical CAGR by >2x)
- Revenue multiple reasonableness vs sector benchmarks

**PHASE 3: Interconnected Analysis Structure**

🧠 AI Reasoning Section:
Start with: "Market Credibility: X/100, Capital Efficiency: Y/100, Execution Credibility: Z/100"
Reference specific calculations: "At {forward revenue multiple}x vs sector median of 6.5x, valuation carries {premium}% premium"
Cross-reference all inputs: burn multiple → urgency, TAM + exits → market validation
MUST integrate: valuation vs ARR, burn vs growth, ownership vs raise amount

⚠️ Key Risks Section:
Mirror assumptions in projections - if assuming high growth, address growth sustainability
Tie risks to red flags: high burn → runway pressure, low exit comps → liquidity risk
Include score-based thresholds: "Capital Efficiency score of X/100 indicates Y risk level"

✅ Suggested Action Section:
Include decision math: "At X% ownership, need $YM+ exit for 3x MOIC"
Reference scoring: "Scores support $X participation level"
Size recommendations based on risk-adjusted return calculations

📊 Scenario Analysis (Bear/Base/Bull Framework):
Bear: Conservative growth (0.5x base), low multiple (0.7x base), high probability if low scores
Base: Reasonable assumptions, median multiple, moderate probability
Bull: Aggressive growth (1.5x base), high multiple (1.3x base), low probability unless high scores
Each scenario shows: Exit Value, Ownership %, MOIC, Probability %

Provide your analysis in the following JSON format:
{
  "recommendation": "${company.isExistingInvestment 
    ? "Portfolio management with decision math: 'Double Down $X - expect Y.Yx MOIC', 'Pro-rata $X - maintain Z% ownership', 'Bridge $X - extend runway for exit', 'Exit - current MOIC sufficient', etc." 
    : "Investment decision with sizing: 'Invest $X - target Y.Yx MOIC based on scenarios', 'Pass - insufficient risk-adjusted returns', 'Monitor - scores improve to X threshold', etc."}",
  "timingBucket": "Enhanced timing with scoring context: 'Double Down (Scores: X/Y/Z)', 'Conditional Investment (Market Score <60)', 'Bridge Pending Validation', 'Wait for Better Entry', 'Reinvest when Efficiency >70', 'Hold', 'Exit Opportunistically', 'Decline'",
  "reasoning": "MUST START with quantitative scores formatted on separate lines: '**Market Credibility:** X/100\\n**Capital Efficiency:** Y/100\\n**Execution Credibility:** Z/100\\n\\nThen 2-3 sentences integrating valuation analysis (revenue multiple vs sector), growth trajectory credibility, and investor validation. Address ownership math and return requirements. Cross-reference scoring to confidence level.",
  "confidence": "Integer 1-5 driven by composite scores: Average score >80 AND clean terms = 5; Average score 60-80 AND moderate complexity = 3-4; Average score <40 OR complex terms OR low investor interest = 1-2. Must justify based on scoring breakdown.",
  "keyRisks": "Score-derived risks: If Capital Efficiency <50: 'Capital efficiency concerns (score: X/100)'. If Market Credibility <50: 'Market validation risks (score: X/100)'. If Execution Credibility <50: 'Execution delivery risks (score: X/100)'. Plus traditional risks tied to specific metrics and assumptions.",
  "suggestedAction": "Scoring-based action with math: 'Scores support $X participation (Y.Yx expected MOIC from base scenario)' or 'Improve Z score to X threshold before investing' or 'Conditional on co-investor validation given low scores'",
  "projectedExitValueRange": "MANDATORY 3-SCENARIO FORMAT with each scenario on separate lines: '**BEAR:** Revenue $XM × Y.Yx multiple = $ZM exit (Probability: X%)\\n**BASE:** Revenue $XM × Y.Yx multiple = $ZM exit (Probability: X%)\\n**BULL:** Revenue $XM × Y.Yx multiple = $ZM exit (Probability: X%)\\n\\nExpected value: $ZM. At X% ownership, expected return: $YM (Z.Zx MOIC)'. Must show calculation steps and probability weighting.",
  "riskAdjustedMonetizationSummary": "STEP-BY-STEP with scenario weighting: 'Revenue Projection: Current $XM → Exit $YM (Z% CAGR over W years)\\n\\nScenario Analysis:\\n**Bear:** Z1.Z1x MOIC (X1% probability)\\n**Base:** Z2.Z2x MOIC (X2% probability)\\n**Bull:** Z3.Z3x MOIC (X3% probability)\\n\\nRisk-Adjusted MOIC: (Z1.Z1×X1% + Z2.Z2×X2% + Z3.Z3×X3%) = Z.Zx\\n\\nComposite scores (Market: Y1/100, Capital: Y2/100, Execution: Y3/100) justify X% success probability weighting.'",
  "executiveSummary": {
    "valuationAssessment": "⚠️ High (8.1x vs 6.5x sector) / 🟡 Market Rate / ✅ Conservative based on forward revenue multiple vs sector median",
    "capitalEfficiency": "✅ Strong (Score: X/100) / 🟡 Moderate (Score: X/100) / ⚠️ Concerning (Score: X/100) - include burn multiple and runway context",
    "marketValidation": "✅ Validated (Score: X/100) / 🟡 Moderate (Score: X/100) / ⚠️ Unproven (Score: X/100) - include TAM and exit activity",
    "executionRisk": "✅ Low (Score: X/100) / 🟡 Moderate (Score: X/100) / ⚠️ High (Score: X/100) - include growth consistency",
    "recommendedAction": "🟢 Participate $X (Y.Yx MOIC) / 🟡 Monitor (improve scores) / 🔴 Pass (insufficient returns)"
  },
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
    
    // Calculate enhanced scores
    const marketCredibilityScore = calculateMarketCredibilityScore(company);
    const capitalEfficiencyScore = calculateCapitalEfficiencyScore(company);
    const executionCredibilityScore = calculateExecutionCredibilityScore(company);
    const scenarios = calculateScenarios(company, marketCredibilityScore, capitalEfficiencyScore, executionCredibilityScore);
    
    // Create executive summary
    const executiveSummary = {
      valuationAssessment: analysis.executiveSummary?.valuationAssessment || 
        (company.forwardRevenueMultiple && company.forwardRevenueMultiple > 8 ? '⚠️ High Valuation' : 
         company.forwardRevenueMultiple && company.forwardRevenueMultiple < 4 ? '✅ Conservative' : '🟡 Market Rate'),
      capitalEfficiency: `${capitalEfficiencyScore >= 75 ? '✅' : capitalEfficiencyScore >= 50 ? '🟡' : '⚠️'} Score: ${capitalEfficiencyScore}/100`,
      marketValidation: `${marketCredibilityScore >= 75 ? '✅' : marketCredibilityScore >= 50 ? '🟡' : '⚠️'} Score: ${marketCredibilityScore}/100`,
      executionRisk: `${executionCredibilityScore >= 75 ? '✅' : executionCredibilityScore >= 50 ? '🟡' : '⚠️'} Score: ${executionCredibilityScore}/100`,
      recommendedAction: analysis.executiveSummary?.recommendedAction || 
        (scenarios.base.moic >= 3 ? '🟢 Participate' : scenarios.base.moic >= 2 ? '🟡 Consider' : '🔴 Pass')
    };

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
      marketCredibilityScore,
      capitalEfficiencyScore,
      executionCredibilityScore,
      executiveSummary,
      scenarios,
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
