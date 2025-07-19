import { EnhancedCompanyData } from '@/types/portfolio';
import { getEnhancedCompanyData } from './enhancedCompanyAnalysis';

export async function enhanceCompaniesWithApiData(
  companies: EnhancedCompanyData[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<EnhancedCompanyData[]> {
  const enhancedCompanies: EnhancedCompanyData[] = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    onProgress?.(i + 1, companies.length);

    try {
      console.log(`Enhancing data for ${company.companyName}...`);
      const enhancedData = await getEnhancedCompanyData(company.companyName, apiKey);

      const enhancedCompany: EnhancedCompanyData = {
        ...company,
        executive: {
          ...company.executive,
          ceoName: enhancedData.ceoName,
          ceoExperience: enhancedData.ceoExperience,
          managementScore: enhancedData.managementScore,
          keyStrengths: enhancedData.keyStrengths,
          industryCategory: enhancedData.industryCategory,
          fundingStage: enhancedData.fundingStage,
          lastFundingDate: enhancedData.lastFundingDate,
        },
        riskAssessment: {
          ...company.riskAssessment,
          overallRiskScore: enhancedData.overallRiskScore,
          marketRiskScore: enhancedData.marketRiskScore,
          riskFactors: enhancedData.riskFactors,
        },
        recommendation: enhancedData.recommendation,
        reasoning: enhancedData.reasoning,
        currentValuation: enhancedData.currentValuation,
        totalReturn: enhancedData.totalReturn,
      };

      enhancedCompanies.push(enhancedCompany);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Failed to enhance data for ${company.companyName}:`, error);
      // Keep original company data if API call fails
      enhancedCompanies.push(company);
    }
  }

  return enhancedCompanies;
}
