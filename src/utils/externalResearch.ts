
interface ResearchResult {
  fundingData: string;
  hiringTrends: string;
  marketPositioning: string;
  recentNews: string;
  competitorActivity: string;
  sources: string[];
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function conductExternalResearch(
  companyName: string,
  apiKey: string
): Promise<ResearchResult> {
  console.log(`\n🔍 STARTING EXTERNAL RESEARCH for ${companyName}...`);
  console.log(`=== DEBUGGING EXTERNAL RESEARCH INTEGRATION ===`);
  console.log(`🔑 Perplexity API Key Analysis:`, {
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'none',
    keyType: typeof apiKey,
    keyStartsWith: apiKey ? apiKey.substring(0, 4) : 'none'
  });
  
  if (!apiKey || apiKey.trim() === '') {
    console.log(`❌ EXTERNAL RESEARCH SKIPPED: No Perplexity API key provided for ${companyName}`);
    return {
      fundingData: 'No external research - API key not provided',
      hiringTrends: 'No external research - API key not provided',
      marketPositioning: 'No external research - API key not provided',
      recentNews: 'No external research - API key not provided',
      competitorActivity: 'No external research - API key not provided',
      sources: ['Internal analysis only - no external API key']
    };
  }
  
  const researchQueries = [
    `${companyName} latest funding round Series A B C venture capital news 2024 2025`,
    `${companyName} hiring trends LinkedIn employee growth headcount team expansion`,
    `${companyName} market position competitors product launches partnerships TechCrunch`,
    `${companyName} recent news press releases product updates customer wins`,
    `${companyName} competitive landscape industry analysis market share`
  ];

  console.log(`📋 Research Queries for ${companyName}:`, researchQueries);

  const results: string[] = [];
  const sources: string[] = [];
  let successfulQueries = 0;
  let totalErrors = 0;

  for (let i = 0; i < researchQueries.length; i++) {
    const query = researchQueries[i];
    console.log(`📡 Research query ${i + 1}/5 for ${companyName}: ${query}`);
    
    try {
      const requestBody = {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a venture capital research analyst. Provide factual, objective information from credible sources like Crunchbase, LinkedIn, TechCrunch, company press releases, and PitchBook. Focus on recent developments (last 6 months), funding activity, hiring trends, and market positioning. Be concise and cite specific sources.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 400,
        search_domain_filter: ['crunchbase.com', 'techcrunch.com', 'linkedin.com', 'pitchbook.com', 'venturebeat.com'],
        search_recency_filter: 'month',
        return_related_questions: false,
        return_images: false
      };

      console.log(`📤 Perplexity API Request ${i + 1}:`, {
        url: 'https://api.perplexity.ai/chat/completions',
        method: 'POST',
        model: requestBody.model,
        messagesCount: requestBody.messages.length,
        temperature: requestBody.temperature,
        maxTokens: requestBody.max_tokens,
        searchDomains: requestBody.search_domain_filter,
        searchRecency: requestBody.search_recency_filter
      });

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Perplexity API Response ${i + 1}:`, {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data: PerplexityResponse = await response.json();
        
        console.log(`📊 Perplexity Response ${i + 1} Data:`, {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          firstChoiceHasMessage: !!data.choices?.[0]?.message,
          firstChoiceHasContent: !!data.choices?.[0]?.message?.content,
          fullData: data
        });
        
        const content = data.choices[0]?.message?.content;
        
        console.log(`📝 Perplexity Response ${i + 1} Content:`, {
          hasContent: !!content,
          contentLength: content?.length || 0,
          contentType: typeof content,
          contentPreview: content ? content.substring(0, 200) + '...' : 'NO CONTENT',
          fullContent: content
        });
        
        if (content && content.trim() !== '') {
          results.push(content);
          successfulQueries++;
          console.log(`✅ Query ${i + 1} successful for ${companyName}`);
          
          // Extract source mentions with enhanced detection
          const sourcePatterns = [
            /Crunchbase/gi,
            /TechCrunch/gi,
            /LinkedIn/gi,
            /PitchBook/gi,
            /AngelList/gi,
            /VentureBeat/gi,
            /company blog/gi,
            /press release/gi,
            /SEC filing/gi,
            /\b[A-Z][a-z]+ (reported|announced|stated|confirmed)/gi,
            /according to [A-Z][a-z]+/gi
          ];
          
          sourcePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              sources.push(...matches);
            }
          });
        } else {
          console.log(`⚠️  Query ${i + 1} returned empty content for ${companyName}`);
          results.push('No relevant data found for this query');
        }
      } else {
        totalErrors++;
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (e) {
          errorDetails = await response.text();
        }
        
        console.error(`❌ Query ${i + 1} failed for ${companyName}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          query: query,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        results.push(`Research query failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
      }
      
      // Rate limiting with progress indication
      if (i < researchQueries.length - 1) {
        console.log(`⏱️  Rate limiting pause (1.2s) before next query...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    } catch (error) {
      totalErrors++;
      console.error(`❌ Research query ${i + 1} exception for ${companyName}:`, {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorName: error instanceof Error ? error.name : 'Unknown error type',
        query: query
      });
      results.push(`Research query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const researchResult = {
    fundingData: results[0] || 'No recent funding data found',
    hiringTrends: results[1] || 'No hiring trend data available',
    marketPositioning: results[2] || 'Limited market positioning data',
    recentNews: results[3] || 'No recent news coverage found',
    competitorActivity: results[4] || 'No competitor activity data',
    sources: [...new Set(sources)] // Remove duplicates
  };

  console.log(`🏁 EXTERNAL RESEARCH COMPLETE for ${companyName}:`, {
    successfulQueries: successfulQueries,
    totalErrors: totalErrors,
    totalQueries: researchQueries.length,
    successRate: `${((successfulQueries / researchQueries.length) * 100).toFixed(1)}%`,
    totalSources: researchResult.sources.length,
    uniqueSources: researchResult.sources,
    hasValidData: successfulQueries > 0,
    fundingDataLength: researchResult.fundingData.length,
    hiringTrendsLength: researchResult.hiringTrends.length,
    marketPositioningLength: researchResult.marketPositioning.length,
    recentNewsLength: researchResult.recentNews.length,
    competitorActivityLength: researchResult.competitorActivity.length
  });

  return researchResult;
}
