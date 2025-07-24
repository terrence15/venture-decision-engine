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
  industry: string;
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
    company.additionalInvestmentRequested
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
      reasoning: 'Missing critical inputs (e.g., growth, burn, TAM, exit environment), which prevents a responsible investment recommendation. Recommend holding until updated data is provided.',
      confidence: 1,
      keyRisks: 'Lack of visibility into company performance, capital efficiency, or exit feasibility makes additional investment highly speculative.',
      suggestedAction: 'Request updated financials, capital plan, and growth KPIs before reassessing capital deployment.',
      externalSources: 'Insufficient internal data - external research not conducted',
      insufficientData: true
    };
  }

  // Conduct external research if Perplexity API key is available and triggers are met
  let externalResearch = '';
  let externalSources = '';
  
  const perplexityKey = getPerplexityApiKey();
  console.log('🔑 [OpenAI Analysis] Perplexity key check:', perplexityKey ? 'FOUND' : 'NOT FOUND');
  
  if (perplexityKey) {
    try {
      console.log('🔍 [OpenAI Analysis] Starting external research with trigger evaluation...');
      onProgress?.(`Researching ${company.companyName}...`);
      
      const research = await conductExternalResearch({
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
EXTERNAL MARKET INTELLIGENCE (APPROVED SOURCES ONLY):
Market Intelligence: ${research.marketIntelligence}
Competitive Landscape: ${research.competitiveLandscape}
Recent Market Activity: ${research.recentNews}
Funding Environment: ${research.fundingHistory}
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

PRIMARY FINANCIAL DATA (REQUIRED BASIS FOR DECISIONS):
Company: ${company.companyName}
Industry: ${company.industry || 'Not specified'}
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

CRITICAL REQUIREMENTS:
1. Base capital recommendation primarily on financial metrics above
2. Use external market context to enhance reasoning and risk assessment where available
3. If external data contradicts financial performance, explain discrepancy and prioritize actual company data
4. Clearly distinguish between data-driven insights and market-context observations
5. If insufficient external data, acknowledge this limitation explicitly

Provide your analysis in the following JSON format:
{
  "recommendation": "Specific capital amount decision based on financial performance (e.g., 'Invest $250K of $1M request', 'Decline', 'Bridge Capital Only - $500K')",
  "timingBucket": "One of: Double Down, Reinvest (3-12 Months), Hold (3-6 Months), Bridge Capital Only, Exit Opportunistically, Decline",
  "reasoning": "2-4 sentences starting with financial analysis, incorporating relevant external market context, and concluding with investment logic",
  "confidence": "Integer 1-5 where 5=strong financial+external validation, 3=solid financial but limited external, 1=insufficient data",
  "keyRisks": "1-2 sentences highlighting material threats based on financial data and available market conditions", 
  "suggestedAction": "1 tactical sentence with specific next step incorporating both performance and market timing",
  "externalSources": "Brief summary of external research quality and limitations"
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
      insufficientData: false
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
        insufficientData: true
      } as any);
      
      onProgress?.(((i + 1) / companies.length) * 100, `Failed: ${company.companyName}`);
    }
  }
  
  return results;
}
