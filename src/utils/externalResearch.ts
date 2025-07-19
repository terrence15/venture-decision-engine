
interface ResearchResult {
  fundingData: string;
  hiringTrends: string;
  marketPositioning: string;
  recentNews: string;
  competitorActivity: string;
  sources: string[];
}

export async function conductExternalResearch(
  companyName: string,
  apiKey: string
): Promise<ResearchResult> {
  
  if (!apiKey || apiKey.trim() === '') {
    return {
      fundingData: 'No external research - API key not provided',
      hiringTrends: 'No external research - API key not provided',
      marketPositioning: 'No external research - API key not provided',
      recentNews: 'No external research - API key not provided',
      competitorActivity: 'No external research - API key not provided',
      sources: ['Internal analysis only']
    };
  }
  
  const queries = [
    `${companyName} funding round Series A B C venture capital 2024 2025`,
    `${companyName} hiring trends employee growth LinkedIn headcount`,
    `${companyName} market position competitors product launches partnerships`,
    `${companyName} recent news press releases product updates`,
    `${companyName} competitive landscape industry analysis market share`
  ];

  const results: string[] = [];
  const sources: string[] = [];

  for (const query of queries) {
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
              content: 'You are a VC research analyst. Provide factual information from credible sources. Be concise and cite sources.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 400,
          search_domain_filter: ['crunchbase.com', 'techcrunch.com', 'linkedin.com', 'pitchbook.com'],
          search_recency_filter: 'month'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (content && content.trim() !== '') {
          results.push(content);
          
          // Extract sources
          const sourcePatterns = [
            /Crunchbase/gi, /TechCrunch/gi, /LinkedIn/gi, /PitchBook/gi,
            /AngelList/gi, /VentureBeat/gi, /company blog/gi, /press release/gi
          ];
          
          sourcePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) sources.push(...matches);
          });
        } else {
          results.push('No relevant data found');
        }
      } else {
        results.push(`Research query failed: ${response.status}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      results.push(`Research error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    fundingData: results[0] || 'No recent funding data found',
    hiringTrends: results[1] || 'No hiring trend data available',
    marketPositioning: results[2] || 'Limited market positioning data',
    recentNews: results[3] || 'No recent news coverage found',
    competitorActivity: results[4] || 'No competitor activity data',
    sources: [...new Set(sources)]
  };
}
