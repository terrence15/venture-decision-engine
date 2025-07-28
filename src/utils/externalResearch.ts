
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
    namedComps: { company: string; acquirer: string; year: string; valuation: string; multiple: string; notes: string; }[];
    multipleType: string;
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
  
  // Test API key first
  if (!apiKey) {
    console.error('❌ [Perplexity Research] No API key provided');
    throw new Error('Perplexity API key is required for external research');
  }
  
  // Quick API connectivity test
  console.log('🧪 [Perplexity Research] Testing API connectivity...');
  const testResult = await testPerplexityApiKey(apiKey);
  if (!testResult.success) {
    console.error('❌ [Perplexity Research] API key test failed:', testResult.error);
    throw new Error(`Perplexity API key validation failed: ${testResult.error}`);
  }
  console.log('✅ [Perplexity Research] API key validated successfully');

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
        industryTrends: [],
        namedComps: [],
        multipleType: 'EV/Revenue'
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
  
  // Industry-centric approach with dynamic multiple types
  if (triggers.hasIndustry) {
    const industryData = normalizeIndustry(company.industry);
    console.log('🏷️ [Perplexity Research] Normalized industry data:', industryData);
    
    // Build industry-specific scoped queries
    const industry = industryData.primary;
    
    // Query 1: Industry TAM and market analysis
    queries.push(`${industry} TAM market size growth rate 2024 addressable market analysis`);
    
    // Query 2: Industry-specific exit multiples (dynamic based on business model)
    const exitMultipleQuery = getIndustrySpecificMultipleQuery(industry);
    queries.push(exitMultipleQuery);
    
    // Query 3: Named M&A comparables with transaction details
    queries.push(`${industry} startup acquisition M&A exits company acquirer price valuation multiple 2023 2024`);
    
    // Query 4: Industry barriers and competitive landscape
    queries.push(`${industry} competitive landscape barriers to entry market share leaders`);
    
  } else {
    // Fallback queries when no industry specified
    queries.push(
      `startup TAM market size analysis venture capital 2024`,
      `startup exit multiples acquisition IPO valuation benchmarks`,
      `startup M&A acquisition exits company names acquirer price 2023 2024`,
      `${company.companyName} funding rounds valuation competitive landscape`
    );
  }
  
  return queries.slice(0, 4);
}

// Helper function to determine correct multiple type based on industry
function getIndustrySpecificMultipleQuery(industry: string): string {
  const lowerIndustry = industry.toLowerCase();
  
  if (lowerIndustry.includes('saas') || lowerIndustry.includes('software') || lowerIndustry.includes('enterprise')) {
    return `${industry} EV/ARR multiples revenue multiples Series A B C exit valuation 2024`;
  } else if (lowerIndustry.includes('marketplace') || lowerIndustry.includes('platform')) {
    return `${industry} EV/GMV multiples transaction volume exit valuation 2024`;
  } else if (lowerIndustry.includes('consumer') || lowerIndustry.includes('retail') || lowerIndustry.includes('ecommerce')) {
    return `${industry} EV/Revenue multiples exit valuation consumer startup 2024`;
  } else if (lowerIndustry.includes('fintech') || lowerIndustry.includes('financial')) {
    return `${industry} EV/Revenue price to book multiples fintech exit valuation 2024`;
  } else if (lowerIndustry.includes('biotech') || lowerIndustry.includes('pharma') || lowerIndustry.includes('medical')) {
    return `${industry} EV/Revenue development stage multiples biotech exit valuation 2024`;
  } else {
    // Default to revenue multiple for unknown industries
    return `${industry} EV/Revenue exit valuation multiples startup acquisition 2024`;
  }
}

// Source validation removed - all sources allowed

function parseStructuredInsights(results: string[], sources: string[]): {
  marketContext: { insight: string; source: string; }[];
  competitivePosition: { insight: string; source: string; }[];
  fundingEnvironment: { insight: string; source: string; }[];
  industryTrends: { insight: string; source: string; }[];
  namedComps: { company: string; acquirer: string; year: string; valuation: string; multiple: string; notes: string; }[];
  multipleType: string;
} {
  const insights = {
    marketContext: [] as { insight: string; source: string; }[],
    competitivePosition: [] as { insight: string; source: string; }[],
    fundingEnvironment: [] as { insight: string; source: string; }[],
    industryTrends: [] as { insight: string; source: string; }[],
    namedComps: [] as { company: string; acquirer: string; year: string; valuation: string; multiple: string; notes: string; }[],
    multipleType: 'EV/Revenue' as string
  };

  // Extract named M&A comparables and determine multiple type
  const allContent = results.join(' ');
  insights.namedComps = extractNamedComps(allContent);
  insights.multipleType = determineMultipleType(allContent);

  // Extract key insights from each result with source attribution
  results.forEach((result, index) => {
    if (!result || result.includes('unavailable') || result.includes('failed')) return;
    
    const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSource = sources[index] || 'External research';
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length < 30) return;
      
      // Categorize insights based on content keywords
      if (trimmed.match(/TAM|market size|addressable market|market opportunity/i)) {
        insights.marketContext.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/competitor|competitive|barriers|market share|leaders/i)) {
        insights.competitivePosition.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/funding|investment|capital|raised|valuation|round|multiple/i)) {
        insights.fundingEnvironment.push({ insight: trimmed, source: relevantSource });
      } else if (trimmed.match(/trend|growth|outlook|forecast|direction/i)) {
        insights.industryTrends.push({ insight: trimmed, source: relevantSource });
      }
    });
  });

  // Limit to top 3 insights per category
  insights.marketContext = insights.marketContext.slice(0, 3);
  insights.competitivePosition = insights.competitivePosition.slice(0, 3);
  insights.fundingEnvironment = insights.fundingEnvironment.slice(0, 3);
  insights.industryTrends = insights.industryTrends.slice(0, 3);

  return insights;
}

// Extract named M&A comparables from research content
function extractNamedComps(content: string): { company: string; acquirer: string; year: string; valuation: string; multiple: string; notes: string; }[] {
  const comps: { company: string; acquirer: string; year: string; valuation: string; multiple: string; notes: string; }[] = [];
  
  // Common acquisition patterns to match
  const acquisitionPatterns = [
    /(\w+(?:\s+\w+)*)\s+(?:acquired by|bought by|purchased by)\s+(\w+(?:\s+\w+)*)\s+(?:for|at)\s+\$?([\d.]+[BMK]?)\s*(?:in\s+)?(\d{4})?/gi,
    /(\w+(?:\s+\w+)*)\s+acquisition\s+by\s+(\w+(?:\s+\w+)*)\s+\$?([\d.]+[BMK]?)\s*(?:in\s+)?(\d{4})?/gi,
    /(\w+(?:\s+\w+)*)\s+sold\s+to\s+(\w+(?:\s+\w+)*)\s+for\s+\$?([\d.]+[BMK]?)\s*(?:in\s+)?(\d{4})?/gi
  ];

  acquisitionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null && comps.length < 5) {
      const company = match[1]?.trim();
      const acquirer = match[2]?.trim();
      const valuation = match[3]?.trim();
      const year = match[4]?.trim() || '2023';
      
      if (company && acquirer && valuation) {
        // Extract multiple if mentioned nearby
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + match[0].length + 100);
        const context = content.slice(contextStart, contextEnd);
        const multipleMatch = context.match(/(\d+(?:\.\d+)?)\s*x\s*(?:revenue|ARR|GMV)/i);
        
        comps.push({
          company: company,
          acquirer: acquirer,
          year: year,
          valuation: valuation,
          multiple: multipleMatch ? `${multipleMatch[1]}x` : 'N/A',
          notes: multipleMatch ? `${multipleMatch[1]}x ${multipleMatch[0].includes('ARR') ? 'ARR' : multipleMatch[0].includes('GMV') ? 'GMV' : 'Revenue'}` : 'Multiple not specified'
        });
      }
    }
  });

  return comps;
}

// Determine the appropriate multiple type based on content
function determineMultipleType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('ev/arr') || lowerContent.includes('arr multiple')) {
    return 'EV/ARR';
  } else if (lowerContent.includes('ev/gmv') || lowerContent.includes('gmv multiple')) {
    return 'EV/GMV';
  } else if (lowerContent.includes('ev/revenue') || lowerContent.includes('revenue multiple')) {
    return 'EV/Revenue';
  } else if (lowerContent.includes('ev/ebitda') || lowerContent.includes('ebitda multiple')) {
    return 'EV/EBITDA';
  } else {
    return 'EV/Revenue'; // Default
  }
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
