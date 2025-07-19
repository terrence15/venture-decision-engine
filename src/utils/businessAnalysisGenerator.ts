
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
  
  const prompt = `You are a senior VC partner conducting market and business analysis. Focus ONLY on business strategy, market conditions, and investment recommendations. DO NOT repeat financial metrics - those will be handled separately.

COMPANY: ${company.companyName}

MARKET DATA:
• TAM Score: ${company.tam}/5
• Exit Environment: ${company.exitActivity}
• Barrier to Entry: ${company.barrierToEntry}/5
• Investment Context: $${(company.totalInvestment / 1000000).toFixed(1)}M invested, $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M requested

${externalResearch ? `
EXTERNAL MARKET RESEARCH:
• Recent Funding Activity: ${externalResearch.fundingData}
• Hiring & Growth Trends: ${externalResearch.hiringTrends}
• Market Position & Competitors: ${externalResearch.marketPositioning}
• Recent Company News: ${externalResearch.recentNews}
• Competitive Landscape: ${externalResearch.competitorActivity}
` : ''}

FOCUS AREAS:
1. Market positioning and competitive dynamics
2. Industry trends and external risks
3. Investment recommendation with specific rationale
4. Concrete next steps with dollar amounts and timelines

Return your analysis in this exact JSON format:
{
  "marketAnalysis": "2-3 sentences about market position, competitive landscape, and industry trends",
  "recommendation": "Specific investment recommendation with dollar amount",
  "timingBucket": "One of: Reinvest, Double Down, Bridge, Hold, Decline",
  "confidence": "Integer 1-5",
  "keyRisks": "Focus on external market risks with specific industry examples",
  "suggestedAction": "Concrete next steps with specific dollar amounts and timeframes"
}`;

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
          content: 'You are a senior venture capital partner focused on market analysis and investment strategy. Provide concise, actionable business analysis without repeating financial metrics.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
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
    marketAnalysis: analysis.marketAnalysis || 'Market analysis unavailable',
    recommendation: analysis.recommendation || 'Hold - Analysis incomplete',
    timingBucket: analysis.timingBucket || 'Hold',
    confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
    keyRisks: analysis.keyRisks || 'Unable to assess risks',
    suggestedAction: analysis.suggestedAction || 'Request additional data'
  };
}
