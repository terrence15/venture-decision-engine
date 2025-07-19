
import { conductExternalResearch, getPerplexityApiKey } from './externalResearch';

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
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<AnalysisResult> {
  // Check for insufficient data (fail-safe logic)
  const criticalFields = [
    company.moic,
    company.revenueGrowth,
    company.burnMultiple || company.runway,
    company.tam,
    company.exitActivity,
    company.additionalInvestmentRequested
  ];
  
  const missingCriticalData = criticalFields.filter(field => 
    field === null || field === undefined || field === ''
  ).length;
  
  if (missingCriticalData >= 2) {
    return {
      recommendation: 'Insufficient data to assess',
      timingBucket: 'N/A',
      reasoning: 'Missing critical inputs (e.g., growth, burn, TAM, exit environment), which prevents a responsible investment recommendation. Recommend holding until updated data is provided.',
      confidence: 1,
      keyRisks: 'Lack of visibility into company performance, capital efficiency, or exit feasibility makes additional investment highly speculative.',
      suggestedAction: 'Request updated financials, capital plan, and growth KPIs before reassessing capital deployment.',
      externalSources: 'Insufficient internal data - external research not conducted',
      insufficientData: true
    };
  }

  // Conduct external research if Perplexity API key is available
  let externalResearch = '';
  let externalSources = '';
  
  const perplexityKey = getPerplexityApiKey();
  if (perplexityKey) {
    try {
      onProgress?.(`Researching ${company.companyName}...`);
      const research = await conductExternalResearch({
        companyName: company.companyName,
        totalInvestment: company.totalInvestment,
        equityStake: company.equityStake,
        additionalInvestmentRequested: company.additionalInvestmentRequested
      }, perplexityKey);
      
      externalResearch = `
EXTERNAL MARKET INTELLIGENCE:
Market Position: ${research.marketIntelligence}
Competitive Landscape: ${research.competitiveLandscape}
Recent Developments: ${research.recentNews}
Funding History: ${research.fundingHistory}
      `;
      
      externalSources = research.sources.length > 0 
        ? `Research sources: ${research.sources.join(', ')}` 
        : 'Real-time web research conducted (sources embedded in analysis)';
        
    } catch (error) {
      console.error('External research failed:', error);
      externalResearch = '\nEXTERNAL RESEARCH: Unable to conduct real-time research due to API limitations.';
      externalSources = 'External research failed - API error occurred';
    }
  } else {
    externalResearch = '\nEXTERNAL RESEARCH: Not available - Perplexity API key not configured. Analysis based on internal portfolio data only.';
    externalSources = 'Internal analysis only - configure Perplexity API key to enable external market research';
  }

  onProgress?.(`Analyzing ${company.companyName}...`);

  const prompt = `You are a venture capital investor evaluating whether to approve an additional capital request from a portfolio company. Use the provided performance, market, valuation, and competitive data to make an informed investment decision.

INTERNAL PORTFOLIO DATA:
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

${externalResearch}

Integrate the internal performance data with external market signals to provide a comprehensive investment recommendation.

Provide your analysis in the following JSON format:
{
  "recommendation": "Specific capital amount decision (e.g., 'Invest $250K of $1M request', 'Decline', 'Bridge Capital Only - $500K')",
  "timingBucket": "One of: Double Down, Reinvest (3-12 Months), Hold (3-6 Months), Bridge Capital Only, Exit Opportunistically, Decline",
  "reasoning": "2-4 sentences combining internal performance data with external market validation. Start with internal performance, reference external signals, flag downside risks, end with investment logic.",
  "confidence": "Integer 1-5 where 5=strong internal+external validation, 3=solid internal but mixed external, 1=missing data",
  "keyRisks": "1-2 sentences highlighting the most material threat, including external market risks",
  "suggestedAction": "1 tactical sentence with specific next step for the investment team",
  "externalSources": "Brief summary of external research sources or limitations"
}

Think like a VC partner. Consider MOIC potential, growth efficiency, exit feasibility, and downside protection. Be objective and data-driven.`;

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response from OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      recommendation: analysis.recommendation || 'Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold (3-6 Months)',
      reasoning: analysis.reasoning || 'Analysis could not be completed with available data.',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks with current information.',
      suggestedAction: analysis.suggestedAction || 'Request additional company data before proceeding.',
      externalSources: externalSources,
      insufficientData: false
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
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
        insufficientData: true
      } as any);
      
      onProgress?.(((i + 1) / companies.length) * 100, `Failed: ${company.companyName}`);
    }
  }
  
  return results;
}
