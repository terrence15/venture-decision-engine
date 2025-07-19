
interface EnhancedAnalysisResult {
  ceoName: string;
  ceoExperience: number;
  managementScore: number;
  overallRiskScore: number;
  marketRiskScore: number;
  keyStrengths: string[];
  riskFactors: string[];
  recommendation: string;
  reasoning: string;
  currentValuation: number;
  totalReturn: number;
  lastFundingDate: string;
  industryCategory: string;
  fundingStage: string;
}

export async function getEnhancedCompanyData(
  companyName: string,
  apiKey: string
): Promise<EnhancedAnalysisResult> {
  const prompt = `You are a venture capital research analyst. Research ${companyName} extensively using all available public sources and provide a comprehensive analysis.

Research this company using external sources like:
- Crunchbase for funding and executive data
- LinkedIn for management team information
- Company website and press releases
- Industry reports and news coverage
- Financial databases and SEC filings if public

Provide your analysis in the following JSON format:
{
  "ceoName": "Full name of the CEO",
  "ceoExperience": "Years of professional experience as integer",
  "managementScore": "Score 0-100 based on team experience, track record, and industry reputation",
  "overallRiskScore": "Score 0-100 where 100 is highest risk, based on market, financial, and operational factors",
  "marketRiskScore": "Score 0-100 for market-specific risks in their industry",
  "keyStrengths": ["List of 3-4 key company/team strengths"],
  "riskFactors": ["List of 3-4 specific risk factors"],
  "recommendation": "One of: Reinvest, Hold, Exit, Monitor",
  "reasoning": "2-3 sentences explaining the recommendation based on research",
  "currentValuation": "Estimated current valuation in USD as integer",
  "totalReturn": "Estimated total return in USD as integer (can be negative)",
  "lastFundingDate": "Most recent funding date in YYYY-MM-DD format or 'Unknown'",
  "industryCategory": "Primary industry category",
  "fundingStage": "Current funding stage (Seed, Series A, Series B, etc.)"
}

Be thorough in your research and provide realistic, data-driven assessments.`;

  try {
    console.log(`Fetching enhanced data for ${companyName} using GPT-4.1...`);
    
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
            content: 'You are an experienced venture capital research analyst with access to comprehensive business databases and market intelligence. Provide thorough, accurate research-based analysis.'
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

    console.log(`Raw response for ${companyName}:`, content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', content);
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`Parsed analysis for ${companyName}:`, analysis);
    
    const result = {
      ceoName: analysis.ceoName || 'CEO TBD',
      ceoExperience: parseInt(analysis.ceoExperience) || 10,
      managementScore: Math.min(100, Math.max(0, parseInt(analysis.managementScore) || 75)),
      overallRiskScore: Math.min(100, Math.max(0, parseInt(analysis.overallRiskScore) || 50)),
      marketRiskScore: Math.min(100, Math.max(0, parseInt(analysis.marketRiskScore) || 65)),
      keyStrengths: Array.isArray(analysis.keyStrengths) ? analysis.keyStrengths : ['Strong management team', 'Market opportunity', 'Product-market fit'],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : ['Market volatility', 'Competitive pressure', 'Regulatory uncertainty'],
      recommendation: analysis.recommendation || 'Hold',
      reasoning: analysis.reasoning || 'Based on current market conditions and company performance.',
      currentValuation: parseInt(analysis.currentValuation) || 1000000,
      totalReturn: parseInt(analysis.totalReturn) || 0,
      lastFundingDate: analysis.lastFundingDate || '2023-01-01',
      industryCategory: analysis.industryCategory || 'Technology',
      fundingStage: analysis.fundingStage || 'Series A'
    };

    console.log(`Enhanced data result for ${companyName}:`, result);
    return result;

  } catch (error) {
    console.error(`Enhanced Company Analysis Error for ${companyName}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze company');
  }
}
