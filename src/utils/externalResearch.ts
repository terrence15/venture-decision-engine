
// Source restrictions removed - full web access enabled

interface CompanyResearchData {
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  additionalInvestmentRequested: number;
  industry: string;
  tam?: number;
  revenue?: number;
  burnMultiple?: number;
  confidence?: number;
  exitActivity?: string;
}

// Research trigger conditions
interface ResearchTriggers {
  hasIndustry: boolean;
  highAdditionalInvestment: boolean;
  lowConfidence: boolean;
  significantTAM: boolean;
  hasExitActivity: boolean;
}

function shouldTriggerResearch(company: CompanyResearchData): ResearchTriggers {
  return {
    hasIndustry: company.industry && company.industry.trim() !== '' && company.industry.toLowerCase() !== 'n/a',
    highAdditionalInvestment: company.additionalInvestmentRequested > company.totalInvestment * 0.5,
    lowConfidence: (company.confidence || 100) < 70,
    significantTAM: (company.tam || 0) > 1000000000, // $1B+ TAM
    hasExitActivity: company.exitActivity && company.exitActivity.trim() !== '' && company.exitActivity.toLowerCase() !== 'n/a'
  };
}

// Enhanced industry mapping for broader search terms
function normalizeIndustry(industry: string): { primary: string; keywords: string[] } {
  const normalized = industry.toLowerCase().trim();
  
  // Industry keyword mapping for better search results
  const industryMap: Record<string, { primary: string; keywords: string[] }> = {
    'fintech': { primary: 'fintech', keywords: ['financial technology', 'digital banking', 'payments'] },
    'saas': { primary: 'software as a service', keywords: ['SaaS', 'cloud software', 'B2B software'] },
    'enterprise saas': { primary: 'enterprise software', keywords: ['B2B software', 'business software', 'SaaS'] },
    'healthtech': { primary: 'digital health', keywords: ['health technology', 'telemedicine', 'medical software'] },
    'biotech': { primary: 'biotechnology', keywords: ['life sciences', 'pharmaceutical', 'medical research'] },
    'edtech': { primary: 'education technology', keywords: ['e-learning', 'online education', 'learning platforms'] },
    'e-commerce': { primary: 'ecommerce', keywords: ['online retail', 'digital commerce', 'marketplace'] },
    'ai': { primary: 'artificial intelligence', keywords: ['machine learning', 'AI technology', 'automation'] },
    'cybersecurity': { primary: 'cybersecurity', keywords: ['information security', 'data protection', 'security software'] }
  };
  
  // Check for exact matches first
  for (const [key, value] of Object.entries(industryMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Default to original industry with basic keyword expansion
  return {
    primary: industry,
    keywords: [industry, `${industry} sector`, `${industry} market`]
  };
}

interface ExternalResearchResult {
  companyName: string;
  marketIntelligence: string;
  competitiveLandscape: string;
  recentNews: string;
  fundingHistory: string;
  sources: string[];
  // Enhanced attribution fields
  structuredInsights: {
    marketContext: { insight: string; source: string; }[];
    competitivePosition: { insight: string; source: string; }[];
    fundingEnvironment: { insight: string; source: string; }[];
    industryTrends: { insight: string; source: string; }[];
  };
  researchQuality: 'comprehensive' | 'limited' | 'minimal' | 'unavailable';
}

export async function conductExternalResearch(
  company: CompanyResearchData,
  apiKey: string
): Promise<ExternalResearchResult> {
  console.log('🔍 [Perplexity Research] Starting external research for:', company.companyName);
  console.log('🔑 [Perplexity Research] API Key present:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NO KEY');
  console.log('🔑 [Perplexity Research] API Key format valid:', apiKey?.startsWith('pplx-'));

  // Evaluate research triggers
  const triggers = shouldTriggerResearch(company);
  console.log('🎯 [Perplexity Research] Research triggers:', triggers);

  // Industry is the primary trigger - always research if industry is provided
  if (!triggers.hasIndustry && !Object.values(triggers).some(Boolean)) {
    console.log('⏭️ [Perplexity Research] No industry or significant triggers found, skipping external research');
    return {
      companyName: company.companyName,
      marketIntelligence: 'External market research skipped - no industry specified',
      competitiveLandscape: 'Competitive analysis skipped - no industry context available',
      recentNews: 'Recent news research skipped - insufficient company context',
      fundingHistory: 'Funding research skipped - no specific triggers identified',
      sources: [],
      structuredInsights: {
        marketContext: [],
        competitivePosition: [],
        fundingEnvironment: [],
        industryTrends: []
      },
      researchQuality: 'unavailable' as const
    };
  }

  // Priority-based query construction
  const queries = constructResearchQueries(company, triggers);
  console.log('📝 [Perplexity Research] Constructed queries:', queries);

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
            content: `You are a research analyst specializing in startup and venture capital research. 

Access the full web and use any relevant sources available to provide comprehensive research on startup valuations, industry benchmarks, exit multiples, and market data.

Always cite specific sources for claims and include publication dates when available. Provide concise, factual information focused on recent developments, funding activities, and market positioning.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1200,
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
        
        // Extract sources from content
        const sourceMatches = content.match(/(?:according to|from|via|source:|reported by)\s+([^.]+)/gi);
        if (sourceMatches) {
          const extractedSources = sourceMatches.map(s => s.replace(/^(according to|from|via|source:|reported by)\s+/i, ''));
          console.log('🔗 [Perplexity Research] Found sources:', extractedSources);
          allSources.push(...extractedSources);
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

  // Parse structured insights from results
  const structuredInsights = parseStructuredInsights(results, allSources);
  
  const finalResult = {
    companyName: company.companyName,
    marketIntelligence: results[0] || 'Market analysis unavailable',
    competitiveLandscape: results[1] || 'Competitive data unavailable', 
    recentNews: results[2] || 'Recent news unavailable',
    fundingHistory: results[3] || 'Funding history unavailable',
    sources: [...new Set(allSources)].slice(0, 5), // Dedupe and limit sources
    structuredInsights,
    researchQuality: determineResearchQuality(results, allSources)
  };

  console.log('🏁 [Perplexity Research] Final research result:', finalResult);
  return finalResult;
}

function constructResearchQueries(company: CompanyResearchData, triggers: ResearchTriggers): string[] {
  const queries: string[] = [];
  
  // Industry-centric approach: Always prioritize industry research when available
  if (triggers.hasIndustry) {
    const industryData = normalizeIndustry(company.industry);
    console.log('🏷️ [Perplexity Research] Normalized industry data:', industryData);
    
    // Start with broader queries, then get more specific
    queries.push(
      // Broad startup metrics and benchmarks
      `startup valuation multiples exit multiples EV revenue ARR venture capital 2024`,
      // Industry-specific exit data
      `${industryData.primary} startup exit multiples IPO acquisition valuation benchmarks`,
      // General SaaS/tech metrics (fallback for most startups)
      `SaaS startup metrics CAC payback burn multiple LTV CAC venture capital benchmarks`,
      // Industry-specific operational metrics
      `${industryData.keywords[0]} startup metrics operational benchmarks funding rounds`
    );
  } else {
    // Fallback queries when no industry specified - use broader terms
    queries.push(
      `startup valuation multiples exit benchmarks venture capital 2024`,
      `venture capital exit multiples IPO acquisition startup valuation`,
      `startup metrics CAC payback burn multiple operational benchmarks`,
      `${company.companyName} funding rounds valuation recent investment activity`
    );
  }
  
  // Additional context-specific queries based on triggers
  if (triggers.highAdditionalInvestment) {
    queries.push(`${company.companyName} Series A B C funding bridge round additional investment`);
  }
  
  if (triggers.hasExitActivity && company.exitActivity) {
    queries.push(`${company.companyName} ${company.exitActivity} IPO acquisition exit strategy`);
  }
  
  // Limit to 4 queries to avoid rate limiting
  return queries.slice(0, 4);
}

// Source validation removed - all sources allowed

function parseStructuredInsights(results: string[], sources: string[]): {
  marketContext: { insight: string; source: string; }[];
  competitivePosition: { insight: string; source: string; }[];
  fundingEnvironment: { insight: string; source: string; }[];
  industryTrends: { insight: string; source: string; }[];
} {
  const insights = {
    marketContext: [] as { insight: string; source: string; }[],
    competitivePosition: [] as { insight: string; source: string; }[],
    fundingEnvironment: [] as { insight: string; source: string; }[],
    industryTrends: [] as { insight: string; source: string; }[]
  };

  // Extract key insights from each result with source attribution
  results.forEach((result, index) => {
    if (!result || result.includes('unavailable') || result.includes('failed')) return;
    
    const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSource = sources[index] || 'External research';
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length < 30) return;
      
      // Categorize insights based on content keywords
      if (trimmed.match(/market|industry|sector|demand|growth|size/i)) {
        insights.marketContext.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/competitor|competitive|rival|comparison|versus/i)) {
        insights.competitivePosition.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/funding|investment|capital|raised|valuation|round/i)) {
        insights.fundingEnvironment.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/trend|future|outlook|forecast|direction/i)) {
        insights.industryTrends.push({ insight: trimmed, source: relevantSource });
      }
    });
  });

  // Limit to top 3 insights per category
  Object.keys(insights).forEach(key => {
    insights[key as keyof typeof insights] = insights[key as keyof typeof insights].slice(0, 3);
  });

  return insights;
}

function determineResearchQuality(results: string[], sources: string[]): 'comprehensive' | 'limited' | 'minimal' | 'unavailable' {
  const validResults = results.filter(r => r && !r.includes('unavailable') && !r.includes('failed')).length;
  const sourcesCount = sources.length;
  
  // More lenient quality assessment - any useful content counts
  if (validResults >= 2 && sourcesCount >= 1) return 'comprehensive';
  if (validResults >= 1) return 'limited';
  if (results.some(r => r && r.length > 50)) return 'minimal';
  return 'unavailable';
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
