
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
  console.log(`=== DEBUGGING AI REASONING GENERATION ===`);
  console.log(`📊 Company Data Input:`, {
    name: company.companyName,
    tam: company.tam,
    exitActivity: company.exitActivity,
    barrierToEntry: company.barrierToEntry,
    totalInvestment: company.totalInvestment,
    additionalInvestmentRequested: company.additionalInvestmentRequested
  });
  
  console.log(`🔑 API Key Status:`, {
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPreview: apiKey ? `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}` : 'none'
  });
  
  console.log(`🔍 External Research Status:`, {
    hasExternalResearch: !!externalResearch,
    sourcesCount: externalResearch?.sources?.length || 0,
    sources: externalResearch?.sources || [],
    fundingDataLength: externalResearch?.fundingData?.length || 0,
    hiringTrendsLength: externalResearch?.hiringTrends?.length || 0,
    marketPositioningLength: externalResearch?.marketPositioning?.length || 0,
    recentNewsLength: externalResearch?.recentNews?.length || 0,
    competitorActivityLength: externalResearch?.competitorActivity?.length || 0
  });

  // Add randomization to ensure unique responses even with identical input
  const timestamp = new Date().toISOString();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  // Generate fallback market context when external research fails
  const marketContext = externalResearch ? `
EXTERNAL MARKET RESEARCH:
• Recent Funding Activity: ${externalResearch.fundingData}
• Hiring & Growth Trends: ${externalResearch.hiringTrends}
• Market Position & Competitors: ${externalResearch.marketPositioning}
• Recent Company News: ${externalResearch.recentNews}
• Competitive Landscape: ${externalResearch.competitorActivity}
• Research Sources: ${externalResearch.sources.join(', ')}
` : `
MARKET CONTEXT (No External Research Available):
• Analysis Date: ${timestamp}
• Industry: Technology/Software (inferred from VC portfolio)
• Market Conditions: Evaluate based on current economic climate and company fundamentals
• Competitive Environment: Assess barrier to entry score of ${company.barrierToEntry}/5
• Exit Environment: ${company.exitActivity}
• Analysis Seed: ${randomSeed} (for variation)
`;

  const prompt = `You are a senior VC partner conducting market and business analysis. Focus ONLY on business strategy, market conditions, and investment recommendations. DO NOT repeat financial metrics - those will be handled separately.

COMPANY: ${company.companyName}
ANALYSIS TIMESTAMP: ${timestamp}
ANALYSIS ID: ${randomSeed}

MARKET DATA:
• TAM Score: ${company.tam}/5
• Exit Environment: ${company.exitActivity}
• Barrier to Entry: ${company.barrierToEntry}/5
• Investment Context: $${(company.totalInvestment / 1000000).toFixed(1)}M invested, $${(company.additionalInvestmentRequested / 1000000).toFixed(1)}M requested

${marketContext}

ANALYSIS REQUIREMENTS:
- Provide unique, specific insights for THIS analysis run (ID: ${randomSeed})
- Consider current market timing and conditions
- Be specific about industry dynamics and competitive positioning
- Provide actionable investment recommendations with concrete next steps
- Vary your analysis approach and focus areas for each company evaluation

FOCUS AREAS (prioritize 2-3 for this analysis):
1. Market positioning and competitive dynamics
2. Industry trends and external market risks
3. Investment timing and market conditions
4. Growth potential and scalability factors
5. Exit strategy and market timing
6. Risk assessment and mitigation strategies

Return your analysis in this exact JSON format:
{
  "marketAnalysis": "2-3 sentences about market position, competitive landscape, and industry trends - BE SPECIFIC and UNIQUE for this analysis",
  "recommendation": "Specific investment recommendation with dollar amount and reasoning",
  "timingBucket": "One of: Reinvest, Double Down, Bridge, Hold, Decline",
  "confidence": "Integer 1-5",
  "keyRisks": "Focus on external market risks with specific industry examples - VARY your risk assessment",
  "suggestedAction": "Concrete next steps with specific dollar amounts and timeframes - BE ACTIONABLE"
}`;

  console.log(`📤 OpenAI API Request Details:`, {
    model: 'gpt-4.1-2025-04-14',
    temperature: 0.4,
    maxTokens: 1200,
    promptLength: prompt.length,
    timestamp: timestamp,
    randomSeed: randomSeed,
    hasExternalData: !!externalResearch
  });

  console.log(`📝 FULL PROMPT BEING SENT TO OPENAI:`, {
    promptPreview: prompt.substring(0, 200) + '...',
    fullPrompt: prompt
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
            content: `You are a senior venture capital partner focused on market analysis and investment strategy. Provide concise, actionable business analysis without repeating financial metrics. Each analysis should be unique and specific to the company and current market conditions. Analysis ID: ${randomSeed}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4, // Increased for more variation
        max_tokens: 1200,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      }),
    });

    console.log(`📥 OpenAI API Response Status:`, {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        console.error(`❌ OpenAI API Error Response (Text) for ${company.companyName}:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`OpenAI API Error: HTTP ${response.status} - ${errorText}`);
      }
      
      console.error(`❌ OpenAI API Error Response (JSON) for ${company.companyName}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error,
        message: errorData.error?.message,
        type: errorData.error?.type,
        code: errorData.error?.code,
        param: errorData.error?.param
      });
      
      throw new Error(`OpenAI API Error: ${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    console.log(`📊 OpenAI API Response Data:`, {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      usage: data.usage,
      model: data.model,
      id: data.id,
      created: data.created,
      object: data.object
    });
    
    const content = data.choices[0]?.message?.content;
    console.log(`📝 OpenAI Response Content Analysis:`, {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentType: typeof content,
      contentPreview: content ? content.substring(0, 300) + '...' : 'NO CONTENT',
      fullContent: content
    });
    
    if (!content) {
      console.error(`❌ No content received from OpenAI for ${company.companyName}`);
      throw new Error('No response content received from OpenAI');
    }

    // Enhanced JSON parsing with multiple fallback strategies
    console.log(`🔍 Attempting JSON parsing for ${company.companyName}...`);
    
    let jsonString = '';
    let analysis = null;
    
    // Strategy 1: Look for JSON block
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
      console.log(`📋 JSON Match Found (Strategy 1):`, {
        matchLength: jsonString.length,
        matchPreview: jsonString.substring(0, 150) + '...',
        fullMatch: jsonString
      });
    } else {
      // Strategy 2: Look for code block
      const codeMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeMatch) {
        jsonString = codeMatch[1];
        console.log(`📋 JSON in Code Block Found (Strategy 2):`, {
          matchLength: jsonString.length,
          matchPreview: jsonString.substring(0, 150) + '...',
          fullMatch: jsonString
        });
      } else {
        console.error(`❌ No JSON found in response for ${company.companyName}:`, {
          contentLength: content.length,
          hasOpenBrace: content.includes('{'),
          hasCloseBrace: content.includes('}'),
          fullContent: content
        });
        throw new Error('Could not find JSON structure in OpenAI response');
      }
    }

    // Attempt to parse JSON
    try {
      analysis = JSON.parse(jsonString);
      console.log(`✅ JSON parsing successful for ${company.companyName}:`, {
        hasMarketAnalysis: !!analysis.marketAnalysis,
        marketAnalysisLength: analysis.marketAnalysis?.length || 0,
        hasRecommendation: !!analysis.recommendation,
        recommendationLength: analysis.recommendation?.length || 0,
        hasTimingBucket: !!analysis.timingBucket,
        timingBucket: analysis.timingBucket,
        hasConfidence: !!analysis.confidence,
        confidence: analysis.confidence,
        hasKeyRisks: !!analysis.keyRisks,
        keyRisksLength: analysis.keyRisks?.length || 0,
        hasSuggestedAction: !!analysis.suggestedAction,
        suggestedActionLength: analysis.suggestedAction?.length || 0,
        fullAnalysis: analysis
      });
    } catch (parseError) {
      console.error(`❌ JSON.parse failed for ${company.companyName}:`, {
        error: parseError,
        jsonString: jsonString,
        jsonLength: jsonString.length,
        parseErrorMessage: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        parseErrorStack: parseError instanceof Error ? parseError.stack : 'No stack trace'
      });
      
      // Try to clean and re-parse JSON
      try {
        const cleanedJson = jsonString
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .trim();
        
        console.log(`🔧 Attempting to parse cleaned JSON:`, {
          originalLength: jsonString.length,
          cleanedLength: cleanedJson.length,
          cleanedJson: cleanedJson
        });
        
        analysis = JSON.parse(cleanedJson);
        console.log(`✅ Cleaned JSON parsing successful for ${company.companyName}`);
      } catch (cleanParseError) {
        console.error(`❌ Cleaned JSON parsing also failed for ${company.companyName}:`, {
          cleanParseError: cleanParseError,
          cleanedJson: cleanedJson
        });
        throw new Error(`JSON parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    const result = {
      marketAnalysis: analysis.marketAnalysis || `Market analysis unavailable for ${company.companyName}`,
      recommendation: analysis.recommendation || 'Hold - Analysis incomplete',
      timingBucket: analysis.timingBucket || 'Hold',
      confidence: Math.min(5, Math.max(1, parseInt(analysis.confidence) || 3)),
      keyRisks: analysis.keyRisks || 'Unable to assess risks',
      suggestedAction: analysis.suggestedAction || 'Request additional data'
    };

    console.log(`🎯 BUSINESS ANALYSIS COMPLETE for ${company.companyName}:`, {
      marketAnalysisPreview: result.marketAnalysis.substring(0, 100) + '...',
      recommendation: result.recommendation,
      timingBucket: result.timingBucket,
      confidence: result.confidence,
      keyRisksPreview: result.keyRisks.substring(0, 100) + '...',
      suggestedActionPreview: result.suggestedAction.substring(0, 100) + '...',
      analysisId: randomSeed,
      timestamp: timestamp
    });

    return result;

  } catch (error) {
    console.error(`❌ BUSINESS ANALYSIS ERROR for ${company.companyName}:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      errorName: error instanceof Error ? error.name : 'Unknown error type',
      analysisId: randomSeed,
      timestamp: timestamp
    });
    
    // Enhanced error fallback with specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      marketAnalysis: `ERROR: Business analysis failed for ${company.companyName}. ${errorMessage} (Analysis ID: ${randomSeed})`,
      recommendation: 'Hold - Technical Error',
      timingBucket: 'Hold',
      confidence: 1,
      keyRisks: `Technical error prevented analysis completion: ${errorMessage}. This may be due to API rate limits, connectivity issues, or response parsing problems.`,
      suggestedAction: `Retry analysis with valid API key and network connection. If problem persists, contact support with Analysis ID: ${randomSeed}`
    };
  }
}
