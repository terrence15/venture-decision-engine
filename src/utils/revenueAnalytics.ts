import { RawCompanyData } from './excelParser';

export interface RevenueAnalytics {
  yoyGrowthPercent: number | null;
  historicalCAGR2Y: number | null;
  forwardCAGR2Y: number | null;
  forwardRevenueMultiple: number | null;
  revenueTrajectoryScore: number | null;
  trajectoryPattern: 'accelerating' | 'stagnating' | 'volatile' | 'insufficient_data';
  credibilityFlag: 'high' | 'moderate' | 'low' | 'red_flag';
  primaryMetric: 'arr' | 'revenue' | 'none';
  timelineData: {
    year2: number | null;
    year1: number | null;
    current: number | null;
    projected1: number | null;
    projected2: number | null;
  };
  // Fail-safe metadata
  dataCompleteness: {
    score: number; // 0-100%
    missingCriticalFields: string[];
    canCalculateYoY: boolean;
    canCalculateHistoricalCAGR: boolean;
    canCalculateForwardCAGR: boolean;
    canCalculateExitModeling: boolean;
    confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  };
  warningFlags: string[];
}

/**
 * Validate required fields for revenue analytics
 */
export function validateRequiredFields(company: RawCompanyData): {
  missingCriticalFields: string[];
  canCalculateYoY: boolean;
  canCalculateHistoricalCAGR: boolean;
  canCalculateForwardCAGR: boolean;
  canCalculateExitModeling: boolean;
} {
  const currentRevenue = company.currentRevenue || company.revenue;
  const currentARR = company.currentARR || company.arr;
  const hasCurrentMetric = (currentRevenue !== null && currentRevenue !== undefined && currentRevenue > 0) ||
                          (currentARR !== null && currentARR !== undefined && currentARR > 0);
  
  const missingCriticalFields: string[] = [];
  
  // Check critical fields
  if (!hasCurrentMetric) missingCriticalFields.push('Current Revenue/ARR');
  if (!company.revenueYearMinus1 && !company.revenueGrowth) missingCriticalFields.push('Revenue Year -1');
  if (!company.projectedRevenueYear1 && !company.projectedRevenueGrowth) missingCriticalFields.push('Projected Revenue +1');
  if (!company.projectedRevenueYear2) missingCriticalFields.push('Projected Revenue +2');
  
  return {
    missingCriticalFields,
    canCalculateYoY: hasCurrentMetric && (company.revenueYearMinus1 !== null && company.revenueYearMinus1 !== undefined),
    canCalculateHistoricalCAGR: hasCurrentMetric && (company.revenueYearMinus2 !== null && company.revenueYearMinus2 !== undefined),
    canCalculateForwardCAGR: hasCurrentMetric && (company.projectedRevenueYear2 !== null && company.projectedRevenueYear2 !== undefined),
    canCalculateExitModeling: hasCurrentMetric && (company.projectedRevenueYear2 !== null && company.projectedRevenueYear2 !== undefined) && 
                             (company.postMoneyValuation !== null && company.postMoneyValuation !== undefined)
  };
}

/**
 * Calculate data completeness score (0-100%)
 */
export function getDataCompletenessScore(company: RawCompanyData): number {
  const fields = [
    company.currentRevenue || company.revenue,
    company.currentARR || company.arr,
    company.revenueYearMinus2,
    company.revenueYearMinus1,
    company.projectedRevenueYear1,
    company.projectedRevenueYear2,
    company.revenueGrowth,
    company.projectedRevenueGrowth
  ];
  
  const nonNullFields = fields.filter(field => field !== null && field !== undefined && field !== 0).length;
  return Math.round((nonNullFields / fields.length) * 100);
}

/**
 * Calculate Year-over-Year growth percentage with fail-safe logic
 */
export function calculateYoYGrowth(current: number | null, previous: number | null): number | null {
  if (!current || !previous || current <= 0 || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Get fail-safe result for YoY Growth
 */
export function getYoYGrowthWithFailsafe(company: RawCompanyData): { value: number | null; warning?: string } {
  const current = company.currentRevenue || company.revenue;
  const previous = company.revenueYearMinus1;
  
  if (!current || current <= 0) {
    return { value: null, warning: "Insufficient data: Current revenue missing" };
  }
  
  if (!previous || previous <= 0) {
    return { value: null, warning: "Unable to calculate YoY Growth: Previous year revenue missing" };
  }
  
  return { value: calculateYoYGrowth(current, previous) };
}

/**
 * Calculate 2-Year Historical CAGR
 */
export function calculateHistoricalCAGR2Y(current: number | null, year2Ago: number | null): number | null {
  if (!current || !year2Ago || current <= 0 || year2Ago <= 0) return null;
  return (Math.pow(current / year2Ago, 1/2) - 1) * 100;
}

/**
 * Get fail-safe result for Historical CAGR
 */
export function getHistoricalCAGRWithFailsafe(company: RawCompanyData): { value: number | null; warning?: string } {
  const current = company.currentRevenue || company.revenue;
  const year2Ago = company.revenueYearMinus2;
  
  if (!current || current <= 0) {
    return { value: null, warning: "Insufficient data: Current revenue missing" };
  }
  
  if (!year2Ago || year2Ago <= 0) {
    return { value: null, warning: "Skip 2-Year CAGR: Year -2 revenue not available" };
  }
  
  return { value: calculateHistoricalCAGR2Y(current, year2Ago) };
}

/**
 * Calculate 2-Year Forward CAGR
 */
export function calculateForwardCAGR2Y(current: number | null, projected2: number | null): number | null {
  if (!current || !projected2 || current <= 0 || projected2 <= 0) return null;
  return (Math.pow(projected2 / current, 1/2) - 1) * 100;
}

/**
 * Get fail-safe result for Forward CAGR
 */
export function getForwardCAGRWithFailsafe(company: RawCompanyData): { value: number | null; warning?: string } {
  const current = company.currentRevenue || company.revenue;
  const projected2 = company.projectedRevenueYear2;
  
  if (!current || current <= 0) {
    return { value: null, warning: "Insufficient data: Current revenue missing" };
  }
  
  if (!projected2 || projected2 <= 0) {
    return { value: null, warning: "Projection not available: Year +2 revenue missing" };
  }
  
  return { value: calculateForwardCAGR2Y(current, projected2) };
}

/**
 * Calculate Forward Revenue Multiple (Exit Valuation / Projected Year +2 Revenue)
 */
export function calculateForwardRevenueMultiple(
  exitValuation: number | null, 
  projected2Revenue: number | null
): number | null {
  if (!exitValuation || !projected2Revenue || exitValuation <= 0 || projected2Revenue <= 0) return null;
  return exitValuation / projected2Revenue;
}

/**
 * Get fail-safe result for Forward Revenue Multiple
 */
export function getForwardRevenueMultipleWithFailsafe(company: RawCompanyData): { value: number | null; warning?: string } {
  const exitValuation = company.postMoneyValuation;
  const projected2Revenue = company.projectedRevenueYear2;
  
  if (!projected2Revenue || projected2Revenue <= 0) {
    return { value: null, warning: "Insufficient data to generate risk-adjusted outputs. Please provide Projected +2 Revenue." };
  }
  
  if (!exitValuation || exitValuation <= 0) {
    return { value: null, warning: "Exit valuation not available for revenue multiple calculation" };
  }
  
  return { value: calculateForwardRevenueMultiple(exitValuation, projected2Revenue) };
}

/**
 * Calculate Revenue Trajectory Score (0-5 scale) with fail-safe logic
 * Based on growth consistency, acceleration patterns, and projection credibility
 */
export function calculateTrajectoryScore(analytics: Partial<RevenueAnalytics>): number | null {
  const { historicalCAGR2Y, forwardCAGR2Y, yoyGrowthPercent, credibilityFlag } = analytics;
  
  if (!historicalCAGR2Y && !forwardCAGR2Y && !yoyGrowthPercent) return null;
  
  let score = 0;
  let factors = 0;
  
  // Historical growth strength (0-2 points)
  if (historicalCAGR2Y !== null) {
    if (historicalCAGR2Y >= 100) score += 2;
    else if (historicalCAGR2Y >= 50) score += 1.5;
    else if (historicalCAGR2Y >= 25) score += 1;
    else if (historicalCAGR2Y >= 0) score += 0.5;
    factors += 2;
  }
  
  // Forward growth projections (0-2 points)
  if (forwardCAGR2Y !== null) {
    if (forwardCAGR2Y >= 100) score += 2;
    else if (forwardCAGR2Y >= 50) score += 1.5;
    else if (forwardCAGR2Y >= 25) score += 1;
    else if (forwardCAGR2Y >= 0) score += 0.5;
    factors += 2;
  }
  
  // Credibility modifier (0-1 points)
  if (credibilityFlag) {
    if (credibilityFlag === 'high') score += 1;
    else if (credibilityFlag === 'moderate') score += 0.7;
    else if (credibilityFlag === 'low') score += 0.3;
    else if (credibilityFlag === 'red_flag') score -= 1;
    factors += 1;
  }
  
  if (factors === 0) return null;
  
  const finalScore = Math.max(0, Math.min(5, score));
  return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
}

/**
 * Get fail-safe trajectory score with confidence assessment
 */
export function getTrajectoryScoreWithFailsafe(analytics: Partial<RevenueAnalytics>, dataCompleteness: number): { 
  value: number | null; 
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  warning?: string;
} {
  const score = calculateTrajectoryScore(analytics);
  
  if (score === null) {
    return { 
      value: null, 
      confidence: 'insufficient',
      warning: "Low confidence: Incomplete data prevents trajectory scoring"
    };
  }
  
  // Adjust confidence based on data completeness
  let confidence: 'high' | 'medium' | 'low' | 'insufficient';
  let warning: string | undefined;
  
  if (dataCompleteness >= 80) {
    confidence = 'high';
  } else if (dataCompleteness >= 60) {
    confidence = 'medium';
    warning = "Medium confidence: Some data gaps limit precision";
  } else if (dataCompleteness >= 40) {
    confidence = 'low';
    warning = "Low confidence: Significant data gaps affect reliability";
  } else {
    confidence = 'insufficient';
    warning = "Insufficient data: Results are directional only";
  }
  
  return { value: score, confidence, warning };
}

/**
 * Determine trajectory pattern from revenue data
 */
export function determineTrajectoryPattern(timelineData: RevenueAnalytics['timelineData']): RevenueAnalytics['trajectoryPattern'] {
  const { year2, year1, current, projected1, projected2 } = timelineData;
  
  // Need at least 3 data points for pattern analysis
  const dataPoints = [year2, year1, current, projected1, projected2].filter(x => x !== null && x > 0);
  if (dataPoints.length < 3) return 'insufficient_data';
  
  // Calculate growth rates between consecutive periods
  const growthRates: number[] = [];
  const timeline = [year2, year1, current, projected1, projected2];
  
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i-1];
    const curr = timeline[i];
    if (prev && curr && prev > 0 && curr > 0) {
      growthRates.push(((curr - prev) / prev) * 100);
    }
  }
  
  if (growthRates.length < 2) return 'insufficient_data';
  
  // Check for acceleration pattern (each growth rate higher than previous)
  const isAccelerating = growthRates.every((rate, i) => i === 0 || rate >= growthRates[i-1] * 0.8);
  
  // Check for stagnation (consistently low growth)
  const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const isStagnating = avgGrowth < 15 && growthRates.every(rate => rate < 30);
  
  // Check for volatility (high variance in growth rates)
  const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
  const isVolatile = variance > 2500; // High variance threshold
  
  if (isAccelerating && avgGrowth > 25) return 'accelerating';
  if (isVolatile) return 'volatile';
  if (isStagnating) return 'stagnating';
  
  return avgGrowth > 30 ? 'accelerating' : 'stagnating';
}

/**
 * Determine credibility flag based on growth patterns and external validation
 */
export function determineCredibilityFlag(
  historicalCAGR: number | null,
  forwardCAGR: number | null,
  investorInterest: number | null
): RevenueAnalytics['credibilityFlag'] {
  if (!historicalCAGR && !forwardCAGR) return 'low';
  
  const historical = historicalCAGR || 0;
  const forward = forwardCAGR || 0;
  const interest = investorInterest || 1;
  
  // Red flag: Aggressive projections with poor validation
  if (forward > historical * 2 && forward > 100 && interest <= 2) {
    return 'red_flag';
  }
  
  // High credibility: Strong validation + reasonable projections
  if (interest >= 4 && forward <= historical * 1.5 && forward > 0) {
    return 'high';
  }
  
  // Low credibility: Poor validation or aggressive projections
  if (interest <= 2 || forward > historical * 3) {
    return 'low';
  }
  
  return 'moderate';
}

/**
 * Determine primary revenue metric (ARR vs Revenue)
 */
export function determinePrimaryMetric(company: RawCompanyData): RevenueAnalytics['primaryMetric'] {
  const hasARR = company.currentARR !== null && company.currentARR !== undefined && company.currentARR > 0;
  const hasRevenue = company.currentRevenue !== null && company.currentRevenue !== undefined && company.currentRevenue > 0;
  
  // Fallback to legacy fields if new fields not available
  if (!hasARR && !hasRevenue) {
    const legacyARR = company.arr !== null && company.arr !== undefined && company.arr > 0;
    const legacyRevenue = company.revenue !== null && company.revenue !== undefined && company.revenue > 0;
    
    if (legacyARR) return 'arr';
    if (legacyRevenue) return 'revenue';
    return 'none';
  }
  
  // Prefer ARR for SaaS/subscription models
  if (hasARR) return 'arr';
  if (hasRevenue) return 'revenue';
  return 'none';
}

/**
 * Main function to compute all revenue analytics for a company with comprehensive fail-safe logic
 */
export function computeRevenueAnalytics(company: RawCompanyData): RevenueAnalytics {
  const primaryMetric = determinePrimaryMetric(company);
  
  // Validate data and get fail-safe metadata
  const validation = validateRequiredFields(company);
  const dataCompleteness = getDataCompletenessScore(company);
  const warningFlags: string[] = [];
  
  // Build timeline data based on primary metric
  let timelineData: RevenueAnalytics['timelineData'];
  
  if (primaryMetric === 'arr') {
    timelineData = {
      year2: null, // ARR timeline not typically tracked historically
      year1: null,
      current: company.currentARR || company.arr,
      projected1: null, // Would need new field for projected ARR
      projected2: null
    };
  } else if (primaryMetric === 'revenue') {
    timelineData = {
      year2: company.revenueYearMinus2,
      year1: company.revenueYearMinus1,
      current: company.currentRevenue || company.revenue,
      projected1: company.projectedRevenueYear1,
      projected2: company.projectedRevenueYear2
    };
  } else {
    timelineData = {
      year2: null,
      year1: null,
      current: null,
      projected1: null,
      projected2: null
    };
    warningFlags.push("No primary revenue metric available");
  }
  
  // Calculate growth metrics with fail-safe logic
  const yoyResult = getYoYGrowthWithFailsafe(company);
  const historicalCAGRResult = getHistoricalCAGRWithFailsafe(company);
  const forwardCAGRResult = getForwardCAGRWithFailsafe(company);
  const revenueMultipleResult = getForwardRevenueMultipleWithFailsafe(company);
  
  // Collect warnings
  if (yoyResult.warning) warningFlags.push(yoyResult.warning);
  if (historicalCAGRResult.warning) warningFlags.push(historicalCAGRResult.warning);
  if (forwardCAGRResult.warning) warningFlags.push(forwardCAGRResult.warning);
  if (revenueMultipleResult.warning) warningFlags.push(revenueMultipleResult.warning);
  
  // Determine patterns and credibility
  const trajectoryPattern = determineTrajectoryPattern(timelineData);
  const credibilityFlag = determineCredibilityFlag(
    historicalCAGRResult.value, 
    forwardCAGRResult.value, 
    company.investorInterest
  );
  
  // Calculate trajectory score with fail-safe
  const analytics: Partial<RevenueAnalytics> = {
    historicalCAGR2Y: historicalCAGRResult.value,
    forwardCAGR2Y: forwardCAGRResult.value,
    yoyGrowthPercent: yoyResult.value,
    credibilityFlag
  };
  
  const trajectoryScoreResult = getTrajectoryScoreWithFailsafe(analytics, dataCompleteness);
  if (trajectoryScoreResult.warning) warningFlags.push(trajectoryScoreResult.warning);
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  if (dataCompleteness >= 80 && validation.missingCriticalFields.length === 0) {
    confidenceLevel = 'high';
  } else if (dataCompleteness >= 60 && validation.missingCriticalFields.length <= 1) {
    confidenceLevel = 'medium';
  } else if (dataCompleteness >= 40) {
    confidenceLevel = 'low';
  } else {
    confidenceLevel = 'insufficient';
    warningFlags.push("Revenue trajectory limited by missing historical/projected data; outputs are directional only.");
  }
  
  // Add specific warnings for missing critical capabilities
  if (!validation.canCalculateExitModeling) {
    warningFlags.push("Risk-adjusted monetization disabled: Missing projected revenue +2 or valuation data");
  }
  
  return {
    yoyGrowthPercent: yoyResult.value,
    historicalCAGR2Y: historicalCAGRResult.value,
    forwardCAGR2Y: forwardCAGRResult.value,
    forwardRevenueMultiple: revenueMultipleResult.value,
    revenueTrajectoryScore: trajectoryScoreResult.value,
    trajectoryPattern,
    credibilityFlag,
    primaryMetric,
    timelineData,
    dataCompleteness: {
      score: dataCompleteness,
      missingCriticalFields: validation.missingCriticalFields,
      canCalculateYoY: validation.canCalculateYoY,
      canCalculateHistoricalCAGR: validation.canCalculateHistoricalCAGR,
      canCalculateForwardCAGR: validation.canCalculateForwardCAGR,
      canCalculateExitModeling: validation.canCalculateExitModeling,
      confidenceLevel: trajectoryScoreResult.confidence
    },
    warningFlags
  };
}

/**
 * Apply computed analytics back to company data
 */
export function enhanceCompanyWithAnalytics(company: RawCompanyData): RawCompanyData {
  const analytics = computeRevenueAnalytics(company);
  
  return {
    ...company,
    yoyGrowthPercent: analytics.yoyGrowthPercent,
    historicalCAGR2Y: analytics.historicalCAGR2Y,
    forwardCAGR2Y: analytics.forwardCAGR2Y,
    forwardRevenueMultiple: analytics.forwardRevenueMultiple,
    revenueTrajectoryScore: analytics.revenueTrajectoryScore
  };
}