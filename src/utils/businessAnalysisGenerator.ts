
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
  
  console.log(`\n🤖 STARTING BUSINESS ANALYSIS for ${company.companyName}`);
  console.log(`📊 Company Data:`, {
    name: company.companyName,
    tam: company.tam,
    exitActivity: company.exitActivity,
    barrierToEntry: company.barrierToEntry,
    totalInvestment: company.totalInvestment,
    additionalInvestmentRequested: company.additionalInvestmentRequested
  });
  
  console.log(`🔑 API Key Status:`, {
    hasApiKey: !!apiKey,
    keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
  });
  
  console.log(`🔍 External Research Status:`, {
    hasExternalResearch: !!externalResearch,
    sourcesCount: externalResearch?.sources?.length || 0,
    sources: externalResearch?.sources || []
  });
  
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
• Research Sources: ${externalResearch.sources.join(', ')}
` : 'NO EXTERNAL RESEARCH AVAILABLE - Base analysis on provided market data only.'}

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

  console.log(`📤 OpenAI API Request:`, {
    model: 'gpt-4.1-2025-04-14',
    temperature: 0.2,
    maxTokens: 1000,
    promptLength: prompt.length
  });

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

    console.log(`📥 OpenAI API Response Status:`, {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ OpenAI API Error for ${company.companyName}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error,
        message: errorData.error?.message,
        type: errorData.error?.type,
        code: errorData.error?.code
      });
      
      throw new Error(`OpenAI API Error: ${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    console.log(`📊 OpenAI API Response Data:`, {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      usage: data.usage,
      model: data.model,
      id: data.id
    });
    
    const content = data.choices[0]?.message?.content;
    console.log(`📝 OpenAI Response Content:`, {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content ? content.substring(0, 200) + '...' : 'NO CONTENT'
    });
    
    if (!content) {
      console.error(`❌ No content received from OpenAI for ${company.companyName}`);
      throw new Error('No response content received from OpenAI');
    }

    // Parse JSON response
    console.log(`🔍 Attempting to parse JSON from OpenAI response...`);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error(`❌ JSON parsing failed for ${company.companyName}:`, {
        content: content,
        hasJsonBraces: content.includes('{') && content.includes('}'),
        contentLength: content.length
      });
      throw new Error('Could not parse JSON response from OpenAI');
    }

    console.log(`📋 JSON Match Found:`, {
      matchLength: jsonMatch[0].length,
      matchPreview: jsonMatch[0].substring(0, 100) + '...'
    });

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      console.log(`✅ JSON parsing successful for ${company.companyName}:`, {
        hasMarketAnalysis: !!analysis.marketAnalysis,
        hasRecommendation: !!analysis.recommendation,
        hasTimingBucket: !!analysis.timingBucket,
        hasConfidence: !!analysis.confidence,
        hasKeyRisks: !!analysis.keyRisks,
        hasSuggestedAction: !!analysis.suggestedAction
      });
    } catch (parseError) {
      console.error(`❌ JSON.parse failed for ${company.companyName}:`, {
        error: parseError,
        jsonString: jsonMatch[0],
        parseErrorMessage: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      throw new Error(`JSON parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    const result = {
      marketAnalysis: analysis.marketAnalysis || 'Market analysis unavailable',
      recommendation: analysis.recommendation || 'Hold - Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks',
      suggestedAction: analysis.suggestedAction || 'Request additional data'
    };

    console.log(`🎯 BUSINESS ANALYSIS COMPLETE for ${company.companyName}:`, result);
    return result;

  } catch (error) {
    console.error(`❌ BUSINESS ANALYSIS ERROR for ${company.companyName}:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Return a clear error fallback that indicates the problem
    return {
      marketAnalysis: `ERROR: Business analysis failed for ${company.companyName}. ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      confidence: 1,
      keyRisks: `Technical error prevented analysis completion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Retry analysis with valid API key and network connection'
    };
  }
}
