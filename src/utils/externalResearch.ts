
interface CompanyResearchData {
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  additionalInvestmentRequested: number;
}

interface ExternalResearchResult {
  companyName: string;
  marketIntelligence: string;
  competitiveLandscape: string;
  recentNews: string;
  fundingHistory: string;
  sources: string[];
}

export async function conductExternalResearch(
  company: CompanyResearchData,
  apiKey: string
): Promise<ExternalResearchResult> {
  const queries = [
    `${company.companyName} startup funding rounds investment news 2024 2023`,
    `${company.companyName} competitive analysis market position industry trends`,
    `${company.companyName} recent news product launches partnerships exits`,
    `${company.companyName} venture capital funding history valuation`
  ];

  const results: string[] = [];
  const allSources: string[] = [];

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
              content: 'You are a research analyst. Provide concise, factual information with sources. Focus on recent developments, funding activities, and market positioning.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 500,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'year',
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || 'No information found';
        results.push(content);
        
        // Extract potential sources from content
        const sourceMatches = content.match(/(?:according to|from|via|source:|reported by)\s+([^.]+)/gi);
        if (sourceMatches) {
          allSources.push(...sourceMatches.map(s => s.replace(/^(according to|from|via|source:|reported by)\s+/i, '')));
        }
      } else {
        results.push('External research unavailable');
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Research query failed: ${query}`, error);
      results.push('Research data unavailable');
    }
  }

  return {
    companyName: company.companyName,
    marketIntelligence: results[1] || 'Market analysis unavailable',
    competitiveLandscape: results[1] || 'Competitive data unavailable', 
    recentNews: results[2] || 'Recent news unavailable',
    fundingHistory: results[3] || 'Funding history unavailable',
    sources: [...new Set(allSources)].slice(0, 5) // Dedupe and limit sources
  };
}

export function getPerplexityApiKey(): string | null {
  return localStorage.getItem('perplexity_api_key');
}

export function setPerplexityApiKey(apiKey: string): void {
  localStorage.setItem('perplexity_api_key', apiKey);
}
