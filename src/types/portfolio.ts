
export interface ExecutiveInfo {
  ceoName?: string;
  ceoExperience?: number;
  foundingDate?: string;
  lastFundingDate?: string;
  managementScore?: number;
  keyStrengths?: string[];
  industryCategory?: string;
  fundingStage?: string;
}

export interface RiskAssessment {
  overallRiskScore: number;
  marketRiskScore?: number;
  riskFactors?: string[];
}

export interface EnhancedCompanyData {
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
  recommendation?: string;
  timingBucket?: string;
  reasoning?: string;
  confidence?: number;
  keyRisks?: string;
  suggestedAction?: string;
  externalSources?: string;
  insufficientData?: boolean;
  
  // Enhanced fields
  executive?: ExecutiveInfo;
  riskAssessment?: RiskAssessment;
  investmentDate?: string;
  currentValuation?: number;
  totalReturn?: number;
  
  // Financial metrics (moved from executive to main interface)
  arrTtm?: number;
  ebitdaMargin?: number;
  topPerformer?: boolean;
  valuationMethodology?: string;
}
