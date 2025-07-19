
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
  console.log(`Conducting external research for ${companyName}...`);
  
  const researchQueries = [
    `${companyName} recent funding rounds Series A B C funding news Crunchbase`,
    `${companyName} LinkedIn hiring trends team growth headcount changes`,
    `${companyName} market position competitors TechCrunch coverage recent news`,
    `${companyName} Glassdoor reviews employee satisfaction leadership changes`,
    `${companyName} product launches partnerships strategic updates press releases`
  ];

  const results: string[] = [];
  const sources: string[] = [];

  for (const query of researchQueries) {
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
              content: 'You are a venture capital research analyst. Provide factual, objective information from credible sources like Crunchbase, LinkedIn, TechCrunch, company press releases, and PitchBook. Focus on funding, hiring trends, market positioning, and operational signals. Be concise and cite specific sources.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 300,
          search_domain_filter: ['crunchbase.com', 'techcrunch.com', 'linkedin.com', 'pitchbook.com'],
          search_recency_filter: 'month',
          return_related_questions: false,
          return_images: false
        }),
      });

      if (response.ok) {
        const data: PerplexityResponse = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          results.push(content);
          // Extract source mentions
          const sourceMatches = content.match(/(Crunchbase|TechCrunch|LinkedIn|PitchBook|AngelList|company blog|press release)/gi);
          if (sourceMatches) {
            sources.push(...sourceMatches);
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Research query failed for ${companyName}:`, error);
      results.push('Limited external data available');
    }
  }

  return {
    fundingData: results[0] || 'No recent funding data found',
    hiringTrends: results[1] || 'No hiring trend data available',
    marketPositioning: results[2] || 'Limited market positioning data',
    recentNews: results[3] || 'No recent news coverage found',
    competitorActivity: results[4] || 'No competitor activity data',
    sources: [...new Set(sources)] // Remove duplicates
  };
}
