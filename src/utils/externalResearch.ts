
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
  console.log(`🔑 Perplexity API Key Status:`, {
    hasApiKey: !!apiKey,
    keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
  });
  
  if (!apiKey) {
    console.log(`❌ No Perplexity API key provided for ${companyName}`);
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

  const results: string[] = [];
  const sources: string[] = [];
  let successfulQueries = 0;

  for (let i = 0; i < researchQueries.length; i++) {
    const query = researchQueries[i];
    console.log(`📡 Research query ${i + 1}/5: ${query.substring(0, 50)}...`);
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      console.log(`📥 Perplexity API Response ${i + 1}:`, {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const data: PerplexityResponse = await response.json();
        const content = data.choices[0]?.message?.content;
        
        console.log(`📊 Perplexity Response ${i + 1}:`, {
          hasContent: !!content,
          contentLength: content?.length || 0,
          contentPreview: content ? content.substring(0, 100) + '...' : 'NO CONTENT'
        });
        
        if (content) {
          results.push(content);
          successfulQueries++;
          console.log(`✅ Query ${i + 1} successful`);
          
          // Extract source mentions
          const sourceMatches = content.match(/(Crunchbase|TechCrunch|LinkedIn|PitchBook|AngelList|VentureBeat|company blog|press release|SEC filing)/gi);
          if (sourceMatches) {
            sources.push(...sourceMatches);
          }
        } else {
          console.log(`⚠️  Query ${i + 1} returned empty content`);
          results.push('No relevant data found');
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Query ${i + 1} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        results.push(`Research query failed: ${response.status} ${response.statusText}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      console.error(`❌ Research query ${i + 1} exception:`, {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      results.push(`Limited external data available: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    totalSources: researchResult.sources.length,
    sources: researchResult.sources,
    hasValidData: successfulQueries > 0
  });

  return researchResult;
}
