
// Approved sources for external research
const APPROVED_SOURCES = [
  'techcrunch.com',
  'crunchbase.com',
  'cbinsights.com',
  'mckinsey.com',
  'bcg.com',
  'bain.com',
  'deloitte.com',
  'pwc.com',
  'reuters.com',
  'bloomberg.com',
  'finance.yahoo.com',
  'finance.google.com',
  'sec.gov',
  'linkedin.com',
  'dealroom.co',
  'statista.com',
  'ssrn.com',
  'nber.org'
];

// Forbidden sources that must not be accessed
const FORBIDDEN_SOURCES = [
  'ibisworld.com',
  'pitchbook.com',
  'capitaliq.com',
  'terminal.bloomberg.com',
  'gartner.com',
  'forrester.com',
  'euromonitor.com',
  'frost.com',
  'morningstar.com',
  'preqin.com',
  'valueline.com'
];

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

  // Evaluate research triggers
  const triggers = shouldTriggerResearch(company);
  console.log('🎯 [Perplexity Research] Research triggers:', triggers);

  // If no significant triggers, return minimal research
  if (!Object.values(triggers).some(Boolean)) {
    console.log('⏭️ [Perplexity Research] No significant triggers found, skipping external research');
    return {
      companyName: company.companyName,
      marketIntelligence: 'External market research skipped - insufficient trigger conditions',
      competitiveLandscape: 'Competitive analysis skipped - no specific triggers identified',
      recentNews: 'Recent news research skipped - minimal risk indicators',
      fundingHistory: 'Funding research skipped - standard investment parameters',
      sources: []
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

CRITICAL SOURCE RESTRICTIONS:
- ONLY use information from: TechCrunch, Crunchbase News, CB Insights, McKinsey, BCG, Bain, Deloitte, PwC (public content), Reuters, Bloomberg News, Yahoo Finance, Google Finance, SEC EDGAR, LinkedIn company profiles, Dealroom, Statista previews, SSRN, NBER abstracts.
- NEVER reference: IBISWorld, PitchBook Pro, Capital IQ, Bloomberg Terminal, Gartner, Forrester, Euromonitor, Frost & Sullivan, Morningstar, Preqin, Value Line, Crunchbase Pro.
- If information is only available from forbidden sources, clearly state "Data not available from approved sources."
- Always cite specific sources for claims and include publication dates when available.

Provide concise, factual information focused on recent developments, funding activities, and market positioning.`
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
        search_domain_filter: APPROVED_SOURCES,
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
        
        // Validate sources in response
        const sourceValidation = validateSources(content);
        console.log('🔒 [Perplexity Research] Source validation:', sourceValidation);
        
        if (sourceValidation.hasForbiddenSources) {
          console.warn('⚠️ [Perplexity Research] Forbidden sources detected, using fallback response');
          results.push('External research limited - data sources do not meet approved criteria');
        } else {
          results.push(content);
        }
        
        // Extract and validate sources from content
        const sourceMatches = content.match(/(?:according to|from|via|source:|reported by)\s+([^.]+)/gi);
        if (sourceMatches) {
          const extractedSources = sourceMatches.map(s => s.replace(/^(according to|from|via|source:|reported by)\s+/i, ''));
          console.log('🔗 [Perplexity Research] Found sources:', extractedSources);
          allSources.push(...extractedSources.filter(source => 
            !FORBIDDEN_SOURCES.some(forbidden => source.toLowerCase().includes(forbidden.replace('.com', '')))
          ));
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

function constructResearchQueries(company: CompanyResearchData, triggers: ResearchTriggers): string[] {
  const queries: string[] = [];
  
  // Priority 1: Industry-specific research if available
  if (triggers.hasIndustry) {
    queries.push(
      `${company.industry} sector M&A activity IPO exits investment trends 2024 2023`,
      `${company.companyName} ${company.industry} competitive analysis market position funding`,
      `${company.industry} market growth forecasts burn rate revenue growth benchmarks`
    );
  }
  
  // Priority 2: High investment or exit activity research
  if (triggers.highAdditionalInvestment || triggers.hasExitActivity) {
    queries.push(`${company.companyName} funding rounds valuation recent investment activity`);
  }
  
  // Priority 3: TAM and market size research for significant markets
  if (triggers.significantTAM) {
    const industryContext = triggers.hasIndustry ? company.industry : 'startup';
    queries.push(`${industryContext} total addressable market size growth trends competitive landscape`);
  }
  
  // Priority 4: General company research
  queries.push(`${company.companyName} recent news partnerships funding history`);
  
  // Limit to 4 queries to avoid rate limiting
  return queries.slice(0, 4);
}

function validateSources(content: string): { hasForbiddenSources: boolean; detectedSources: string[] } {
  const detectedSources: string[] = [];
  let hasForbiddenSources = false;
  
  FORBIDDEN_SOURCES.forEach(forbiddenSource => {
    const domain = forbiddenSource.replace('.com', '');
    if (content.toLowerCase().includes(domain)) {
      detectedSources.push(forbiddenSource);
      hasForbiddenSources = true;
    }
  });
  
  return { hasForbiddenSources, detectedSources };
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
