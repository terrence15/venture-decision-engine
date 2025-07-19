
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
  console.log('🔍 [Perplexity Research] Starting external research for:', company.companyName);
  console.log('🔑 [Perplexity Research] API Key present:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NO KEY');
  console.log('🔑 [Perplexity Research] API Key format valid:', apiKey?.startsWith('pplx-'));

  const queries = [
    `${company.companyName} startup funding rounds investment news 2024 2023`,
    `${company.companyName} competitive analysis market position industry trends`,
    `${company.companyName} recent news product launches partnerships exits`,
    `${company.companyName} venture capital funding history valuation`
  ];

  console.log('📝 [Perplexity Research] Prepared queries:', queries);

  const results: string[] = [];
  const allSources: string[] = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`🚀 [Perplexity Research] Making API call ${i + 1}/4 for query:`, query);
    
    try {
      const requestBody = {
        model: 'sonar-reasoning',
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
      };

      console.log('📤 [Perplexity Research] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [Perplexity Research] Response status:', response.status);
      console.log('📥 [Perplexity Research] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Perplexity Research] Response data:', data);
        
        const content = data.choices[0]?.message?.content || 'No information found';
        console.log('📄 [Perplexity Research] Extracted content length:', content.length);
        
        results.push(content);
        
        // Extract potential sources from content
        const sourceMatches = content.match(/(?:according to|from|via|source:|reported by)\s+([^.]+)/gi);
        if (sourceMatches) {
          console.log('🔗 [Perplexity Research] Found sources:', sourceMatches);
          allSources.push(...sourceMatches.map(s => s.replace(/^(according to|from|via|source:|reported by)\s+/i, '')));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [Perplexity Research] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        results.push(`External research failed: ${response.status} ${response.statusText}`);
      }
      
      // Small delay to avoid rate limiting
      console.log('⏳ [Perplexity Research] Waiting 500ms before next request...');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ [Perplexity Research] Network/Parse Error for query: ${query}`, error);
      console.error('❌ [Perplexity Research] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      results.push(`Research query failed: ${error.message}`);
    }
  }

  const finalResult = {
    companyName: company.companyName,
    marketIntelligence: results[0] || 'Market analysis unavailable',
    competitiveLandscape: results[1] || 'Competitive data unavailable', 
    recentNews: results[2] || 'Recent news unavailable',
    fundingHistory: results[3] || 'Funding history unavailable',
    sources: [...new Set(allSources)].slice(0, 5) // Dedupe and limit sources
  };

  console.log('🏁 [Perplexity Research] Final research result:', finalResult);
  return finalResult;
}

export function getPerplexityApiKey(): string | null {
  const key = localStorage.getItem('perplexity_api_key');
  console.log('🔑 [Perplexity Research] Retrieved API key from localStorage:', key ? `${key.substring(0, 8)}...` : 'NULL');
  return key;
}

export function setPerplexityApiKey(apiKey: string): void {
  console.log('💾 [Perplexity Research] Storing API key in localStorage:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NULL');
  localStorage.setItem('perplexity_api_key', apiKey);
}

export async function testPerplexityApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  console.log('🧪 [Perplexity Research] Testing API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NO KEY');
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        max_tokens: 10
      }),
    });

    console.log('🧪 [Perplexity Research] Test response status:', response.status);
    
    if (response.ok) {
      console.log('✅ [Perplexity Research] API key test successful');
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('❌ [Perplexity Research] API key test failed:', errorText);
      return { success: false, error: `API returned ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ [Perplexity Research] API key test error:', error);
    return { success: false, error: error.message };
  }
}
