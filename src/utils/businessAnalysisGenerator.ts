
interface ExternalResearch {
  fundingData: string;
  hiringTrends: string;
  marketPositioning: string;
  recentNews: string;
  competitorActivity: string;
  sources: string[];
}

interface CompanyData {
  companyName: string;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  totalInvestment: number;
  additionalInvestmentRequested: number;
}

interface BusinessAnalysisResult {
  marketAnalysis: string;
  recommendation: string;
  timingBucket: string;
  confidence: number;
  keyRisks: string;
  suggestedAction: string;
}

export async function generateBusinessAnalysis(
  company: CompanyData,
  apiKey: string,
  externalResearch?: ExternalResearch
): Promise<BusinessAnalysisResult> {
  
  const timestamp = new Date().toISOString();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  const marketContext = externalResearch ? `
EXTERNAL MARKET RESEARCH:
• Recent Funding: ${externalResearch.fundingData}
• Hiring Trends: ${externalResearch.hiringTrends}
• Market Position: ${externalResearch.marketPositioning}
• Recent News: ${externalResearch.recentNews}
• Competitors: ${externalResearch.competitorActivity}
• Sources: ${externalResearch.sources.join(', ')}
` : `
MARKET CONTEXT:
• Analysis Date: ${timestamp}
• TAM Score: ${company.tam}/5
• Exit Environment: ${company.exitActivity}
• Barrier to Entry: ${company.barrierToEntry}/5
• Analysis ID: ${randomSeed}
`;

  const prompt = `You are a senior VC partner analyzing ${company.companyName}. Focus on business strategy and market conditions. DO NOT repeat financial metrics.

COMPANY: ${company.companyName}
INVESTMENT: $${(company.totalInvestment / 1000000).toFixed(1)}M invested, $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M requested

${marketContext}

Provide unique analysis (ID: ${randomSeed}) focusing on market positioning, competitive dynamics, and investment timing.

Return JSON format:
{
  "marketAnalysis": "Specific market position and industry trends analysis",
  "recommendation": "Investment recommendation with reasoning",
  "timingBucket": "One of: Reinvest, Double Down, Bridge, Hold, Decline",
  "confidence": "Integer 1-5",
  "keyRisks": "Key market and competitive risks",
  "suggestedAction": "Specific next steps with amounts and timeframes"
}`;

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
            content: `Senior VC partner providing unique market analysis. Analysis ID: ${randomSeed}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1200,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'API Error' } }));
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content received');
    }

    // Simple JSON extraction and parsing
    const jsonMatch = content.match(/\{[\s\S]*\}/) || content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    let analysis;
    try {
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      // Clean and retry once
      const cleanedJson = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .trim();
      analysis = JSON.parse(cleanedJson);
    }
    
    return {
      marketAnalysis: analysis.marketAnalysis || `Market analysis for ${company.companyName}`,
      recommendation: analysis.recommendation || 'Hold - Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks',
      suggestedAction: analysis.suggestedAction || 'Request additional data'
    };

  } catch (error) {
    return {
      marketAnalysis: `Analysis failed for ${company.companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      confidence: 1,
      keyRisks: `Technical error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: `Retry analysis. Error ID: ${randomSeed}`
    };
  }
}
