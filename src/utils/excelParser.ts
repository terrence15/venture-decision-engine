
import * as XLSX from 'xlsx';
import { enhanceCompanyWithAnalytics } from './revenueAnalytics';

export interface RawCompanyData {
  id: string;
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  projectedRevenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  industry: string;
  investorInterest: number | null;
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
  roundComplexity: number | null;
  exitTimeline: number | null;
  revenue: number | null;
  arr: number | null;
  caEquityValuation: number | null; // CA Equity Valuation in dollars
  isExistingInvestment: boolean; // True if existing portfolio company, false if new potential investment
  seriesStage: string | null; // Series/Stage for contextual framing (e.g., "Seed", "Series A", "Growth")
  totalRaiseRequest: number | null; // Full round size the company is targeting
  amountRequestedFromFirm: number | null; // Portion of the round the company wants from our firm
  // Revenue Timeline Fields
  revenueYearMinus2: number | null;
  revenueYearMinus1: number | null;
  currentRevenue: number | null;
  projectedRevenueYear1: number | null;
  projectedRevenueYear2: number | null;
  currentARR: number | null;
  // Calculated Analytics (computed from timeline data)
  yoyGrowthPercent: number | null;
  historicalCAGR2Y: number | null;
  forwardCAGR2Y: number | null;
  forwardRevenueMultiple: number | null;
  revenueTrajectoryScore: number | null; // 0-5 scale
}

// Updated column mapping with exact headers from Excel
const COLUMN_MAPPINGS = {
  'COMPANY': 'companyName',
  'Company Name': 'companyName',
  'Total Investment ($ in Thousands)': 'totalInvestment',
  'Total Investment  \r\n($ in Thousands)': 'totalInvestment',
  'Equity Stake % (Fully Diluted)': 'equityStake',
  'MOIC (Implied)': 'moic',
  'Implied MOIC (x)': 'moic',
  'Implied MOIC (x) ': 'moic',
  'TTM Revenue Growth': 'revenueGrowth',
  'TTM Revnue Growth ': 'revenueGrowth',
  'Burn Multiple (Burn Rate / ARR)': 'burnMultiple',
  'Burn Multiple (Net Burn/Net New ARR)': 'burnMultiple',
  'Burn Multiple (Net Burn/Net New ARR) ': 'burnMultiple',
  'Runway (Months)': 'runway',
  'Runway (Months) ': 'runway',
  'TAM Rating (1–5) (Competitive + Growing Market)': 'tam',
  'TAM \r\n(1-5, 5 being completely untapped and growing market)': 'tam',
  'Exit Activity in Sector (High / Moderate / Low)': 'exitActivity',
  'Exit Activity in Sector (ie. High, Moderaate, Low)': 'exitActivity',
  'Barrier to Entry (1–5) (Advantage vs. New Firms to Enter)': 'barrierToEntry',
  'Barrier to Entry (1-5, 5 being the best because it\'s diffcult for potential competitors to enter the market)': 'barrierToEntry',
  'Barrier to Entry (1-5, 5 being the best because it\'s diffcult for potential competitors to enter the market) ': 'barrierToEntry',
  'Additional Investment Request': 'additionalInvestmentRequested',
  'Additional Investment Requested ($)': 'additionalInvestmentRequested',
  'Industry': 'industry',
  'Industry Sector': 'industry',
  'Sector': 'industry',
  'Investor Interest / Ability to Raise Capital': 'investorInterest',
  'Investor Interest': 'investorInterest',
  'Ability to Raise Capital': 'investorInterest',
  'Projected Revenue Growth (Next 12 Months)': 'projectedRevenueGrowth',
  'Projected Revenue Growth': 'projectedRevenueGrowth',
  'Forward Revenue Growth': 'projectedRevenueGrowth',
  'Revenue Growth Projection': 'projectedRevenueGrowth',
  'Pre-Money Valuation ($)': 'preMoneyValuation',
  'Pre-Money Valuation': 'preMoneyValuation',
  'Pre Money Valuation': 'preMoneyValuation',
  'PreMoney Valuation': 'preMoneyValuation',
  'Post-Money Valuation ($)': 'postMoneyValuation',
  'Post-Money Valuation': 'postMoneyValuation',
  'Post Money Valuation': 'postMoneyValuation',
  'PostMoney Valuation': 'postMoneyValuation',
  'Round Complexity': 'roundComplexity',
  'Round Complexity (1-5)': 'roundComplexity',
  'Complexity': 'roundComplexity',
  'Deal Complexity': 'roundComplexity',
  'Exit Timeline (in years)': 'exitTimeline',
  'Exit Timeline': 'exitTimeline',
  'Timeline': 'exitTimeline',
  'Years to Exit': 'exitTimeline',
  'Exit Timeline (years)': 'exitTimeline',
  'Timeline to Exit': 'exitTimeline',
  'Revenue': 'revenue',
  'Total Revenue': 'revenue',
  'Annual Revenue': 'revenue',
  'Latest Revenue': 'revenue',
  'Revenue ($)': 'revenue',
  'CA Equity Valuation ($ in Thousands)': 'caEquityValuation',
  'CA Equity Valuation \r\n($ in Thousands)': 'caEquityValuation',
  'CA Equity Valuation': 'caEquityValuation',
  'Equity Valuation': 'caEquityValuation',
  'ARR': 'arr',
  'Annual Recurring Revenue': 'arr',
  'Recurring Revenue': 'arr',
  'Subscription Revenue': 'arr',
  'ARR ($)': 'arr',
  // Revenue Timeline Column Mappings
  'Revenue Year -2': 'revenueYearMinus2',
  'Revenue Year -2 ($)': 'revenueYearMinus2',
  'Revenue Two Years Ago': 'revenueYearMinus2',
  'Revenue -2': 'revenueYearMinus2',
  'Rev Year -2': 'revenueYearMinus2',
  'Revenue Year -1': 'revenueYearMinus1',
  'Revenue Year -1 ($)': 'revenueYearMinus1',
  'Revenue Last Year': 'revenueYearMinus1',
  'Revenue -1': 'revenueYearMinus1',
  'Rev Year -1': 'revenueYearMinus1',
  'Current Revenue': 'currentRevenue',
  'Current Revenue ($)': 'currentRevenue',
  'Current Year Revenue': 'currentRevenue',
  'TTM Revenue': 'currentRevenue',
  'Rev Current': 'currentRevenue',
  'Projected Revenue Year +1': 'projectedRevenueYear1',
  'Projected Revenue Year +1 ($)': 'projectedRevenueYear1',
  'Revenue Next Year': 'projectedRevenueYear1',
  'Revenue +1': 'projectedRevenueYear1',
  'Rev Year +1': 'projectedRevenueYear1',
  'Projected Revenue Year +2': 'projectedRevenueYear2',
  'Projected Revenue Year +2 ($)': 'projectedRevenueYear2',
  'Revenue Year Two': 'projectedRevenueYear2',
  'Revenue +2': 'projectedRevenueYear2',
  'Rev Year +2': 'projectedRevenueYear2',
  'Current ARR': 'currentARR',
  'Current ARR ($)': 'currentARR',
  'TTM ARR': 'currentARR',
  'ARR Current': 'currentARR',
  // Series/Stage Column Mappings
  'Series/Stage': 'seriesStage',
  'Series': 'seriesStage',
  'Stage': 'seriesStage',
  'Funding Stage': 'seriesStage',
  'Round Type': 'seriesStage',
  'Investment Stage': 'seriesStage',
  'Funding Round': 'seriesStage',
  'Round Stage': 'seriesStage',
  // Total Raise Request Column Mappings
  'Total Raise Request ($)': 'totalRaiseRequest',
  'Total Raise Request': 'totalRaiseRequest',
  'Total Raise': 'totalRaiseRequest',
  'Round Size': 'totalRaiseRequest',
  'Full Raise': 'totalRaiseRequest',
  'Target Raise': 'totalRaiseRequest',
  'Total Funding': 'totalRaiseRequest',
  'Round Amount': 'totalRaiseRequest',
  'Target Round Size': 'totalRaiseRequest',
  // Amount Requested from Firm Column Mappings
  'Amount Requested from Our Firm ($)': 'amountRequestedFromFirm',
  'Amount Requested from Our Firm': 'amountRequestedFromFirm',
  'Amount from Us': 'amountRequestedFromFirm',
  'Our Portion': 'amountRequestedFromFirm',
  'Firm Request': 'amountRequestedFromFirm',
  'Our Amount': 'amountRequestedFromFirm',
  'Requested from Firm': 'amountRequestedFromFirm',
  'Our Investment': 'amountRequestedFromFirm',
  'Amount Requested': 'amountRequestedFromFirm'
};

// Enhanced keyword mappings for better fuzzy matching
const KEYWORD_MAPPINGS: { [key: string]: string[] } = {
  'companyName': ['company', 'name'],
  'totalInvestment': ['total', 'investment', 'thousands'],
  'equityStake': ['equity', 'stake', 'fully', 'diluted', 'percent'],
  'moic': ['moic', 'implied'],
  'revenueGrowth': ['ttm', 'revenue', 'growth'],
  'projectedRevenueGrowth': ['projected', 'revenue', 'growth', '12', 'months', 'forward'],
  'burnMultiple': ['burn', 'multiple', 'rate', 'arr'],
  'runway': ['runway', 'months'],
  'tam': ['tam', 'rating', 'competitive', 'growing', 'market'],
  'exitActivity': ['exit', 'activity', 'sector', 'high', 'moderate', 'low'],
  'barrierToEntry': ['barrier', 'entry', 'advantage', 'firms', 'enter'],
  'additionalInvestmentRequested': ['additional', 'investment', 'request'],
  'industry': ['industry', 'sector'],
  'investorInterest': ['investor', 'interest', 'ability', 'raise', 'capital'],
  'preMoneyValuation': ['pre', 'money', 'valuation'],
  'postMoneyValuation': ['post', 'money', 'valuation'],
  'roundComplexity': ['round', 'complexity', 'terms', 'structure', 'deal'],
  'exitTimeline': ['exit', 'timeline', 'years', 'time', 'horizon', 'liquidity'],
  'revenue': ['revenue', 'total', 'annual', 'latest'],
  'arr': ['arr', 'annual', 'recurring', 'subscription'],
  'caEquityValuation': ['ca', 'equity', 'valuation', 'thousands'],
  // Revenue Timeline Keywords
  'revenueYearMinus2': ['revenue', 'year', 'minus', '2', 'two', 'ago'],
  'revenueYearMinus1': ['revenue', 'year', 'minus', '1', 'last', 'previous'],
  'currentRevenue': ['current', 'revenue', 'ttm', 'present'],
  'projectedRevenueYear1': ['projected', 'revenue', 'year', '1', 'next', 'plus'],
  'projectedRevenueYear2': ['projected', 'revenue', 'year', '2', 'plus', 'forward'],
  'currentARR': ['current', 'arr', 'ttm', 'annual', 'recurring'],
  'seriesStage': ['series', 'stage', 'funding', 'round', 'seed', 'growth', 'investment'],
  'totalRaiseRequest': ['total', 'raise', 'round', 'size', 'target', 'funding', 'amount'],
  'amountRequestedFromFirm': ['amount', 'requested', 'firm', 'portion', 'investment', 'our']
};

// Improved fuzzy matching function
function findBestMatch(target: string, options: string[]): string | null {
  const normalize = (str: string) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };
  
  const normalizedTarget = normalize(target);
  
  // First try exact match
  for (const option of options) {
    if (!option || typeof option !== 'string') continue;
    if (normalize(option) === normalizedTarget) {
      console.log(`Exact match found: "${option}" for "${target}"`);
      return option;
    }
  }
  
  // Special case for company name - match "COMPANY" directly
  if (target === 'companyName') {
    for (const option of options) {
      if (!option || typeof option !== 'string') continue;
      if (normalize(option) === 'company') {
        console.log(`Direct company match found: "${option}" for "${target}"`);
        return option;
      }
    }
  }
  
  // Then try keyword matching
  const targetField = Object.keys(COLUMN_MAPPINGS).find(key => 
    COLUMN_MAPPINGS[key as keyof typeof COLUMN_MAPPINGS] === target
  );
  
  if (targetField) {
    const keywords = KEYWORD_MAPPINGS[target] || [];
    
    for (const option of options) {
      if (!option || typeof option !== 'string') continue;
      const normalizedOption = normalize(option);
      
      // Check if option contains all important keywords
      const keywordMatches = keywords.filter(keyword => 
        normalizedOption.includes(keyword)
      );
      
      if (keywordMatches.length >= Math.min(2, keywords.length)) {
        console.log(`Keyword match found: "${option}" for "${target}" (matched: ${keywordMatches.join(', ')})`);
        return option;
      }
    }
  }
  
  console.log(`No match found for "${target}"`);
  return null;
}

// Create column mapping
function createColumnMapping(headers: string[]): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};
  
  const validHeaders = headers.filter(header => header && typeof header === 'string');
  console.log('Available headers:', validHeaders);
  
  // First try exact matches from COLUMN_MAPPINGS
  Object.keys(COLUMN_MAPPINGS).forEach(expectedColumn => {
    const exactMatch = validHeaders.find(header => 
      header.trim() === expectedColumn.trim()
    );
    
    if (exactMatch) {
      mapping[exactMatch] = COLUMN_MAPPINGS[expectedColumn as keyof typeof COLUMN_MAPPINGS];
      console.log(`Exact mapping: "${exactMatch}" → "${COLUMN_MAPPINGS[expectedColumn as keyof typeof COLUMN_MAPPINGS]}"`);
      return;
    }
  });
  
  // Then try fuzzy matching for unmapped fields
  const mappedFields = Object.values(mapping);
  const fieldsToMap = ['companyName', 'totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'projectedRevenueGrowth', 'burnMultiple', 'runway', 'tam', 'exitActivity', 'barrierToEntry', 'additionalInvestmentRequested', 'industry', 'investorInterest', 'preMoneyValuation', 'postMoneyValuation', 'roundComplexity', 'exitTimeline', 'revenue', 'arr', 'caEquityValuation', 'seriesStage', 'totalRaiseRequest', 'amountRequestedFromFirm', 'revenueYearMinus2', 'revenueYearMinus1', 'currentRevenue', 'projectedRevenueYear1', 'projectedRevenueYear2', 'currentARR'];
  
  fieldsToMap.forEach(fieldName => {
    if (!mappedFields.includes(fieldName)) {
      const fuzzyMatch = findBestMatch(fieldName, validHeaders);
      if (fuzzyMatch) {
        mapping[fuzzyMatch] = fieldName;
        console.log(`Fuzzy mapping: "${fuzzyMatch}" → "${fieldName}"`);
      }
    }
  });
  
  console.log('Final column mapping:', mapping);
  return mapping;
}

// Investment status detection function
function detectInvestmentStatus(totalInvestment: number, equityStake: number, caEquityValuation: number | null): boolean {
  // If any of the three key investment indicators are 0, it's a new potential investment
  const isNewInvestment = totalInvestment === 0 || equityStake === 0 || (caEquityValuation !== null && caEquityValuation === 0);
  
  console.log(`Investment status detection: totalInvestment=${totalInvestment}, equityStake=${equityStake}, caEquityValuation=${caEquityValuation} → ${isNewInvestment ? 'New Investment' : 'Existing Portfolio Company'}`);
  
  return !isNewInvestment; // Return true for existing investments
}

export function parseExcelFile(file: File): Promise<RawCompanyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('Starting Excel file parsing...');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Look for "Main Page" sheet first, fallback to first sheet
        let sheetName = 'Main Page';
        if (!workbook.SheetNames.includes(sheetName)) {
          // Also try "Main Page " with trailing space
          const mainPageWithSpace = workbook.SheetNames.find(name => name.trim() === 'Main Page');
          if (mainPageWithSpace) {
            sheetName = mainPageWithSpace;
            console.log(`Using "${sheetName}" sheet (with trailing space)`);
          } else {
            sheetName = workbook.SheetNames[0];
            console.log(`"Main Page" sheet not found, using "${sheetName}" instead`);
          }
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel file must contain at least a header row and one data row');
        }
        
        // Find the header row
        let headerRowIndex = 0;
        let maxFilledCells = 0;
        
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i] as any[];
          const filledCells = row.filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0).length;
          if (filledCells > maxFilledCells) {
            maxFilledCells = filledCells;
            headerRowIndex = i;
          }
        }
        
        console.log(`Using row ${headerRowIndex + 1} as header row`);
        
        const headers = jsonData[headerRowIndex] as string[];
        console.log('Headers found:', headers);
        
        // Create column mapping
        const columnMapping = createColumnMapping(headers);
        
        // Check for essential columns
        const essentialFields = ['companyName', 'totalInvestment', 'equityStake'];
        const foundEssentials = essentialFields.filter(field => 
          Object.values(columnMapping).includes(field)
        );
        
        if (foundEssentials.length < essentialFields.length) {
          const missingEssentials = essentialFields.filter(field => 
            !Object.values(columnMapping).includes(field)
          );
          throw new Error(`Could not find essential columns for: ${missingEssentials.join(', ')}. Available headers: ${headers.join(', ')}`);
        }
        
        // Parse data rows
        const companies: RawCompanyData[] = [];
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Skip empty rows
          if (!row || row.every(cell => !cell)) continue;
          
          const company: any = {
            id: `excel-${i}`,
          };
          
          // Map each column to our data structure
          headers.forEach((header, index) => {
            const fieldName = columnMapping[header];
            if (fieldName && row[index] !== undefined && row[index] !== null) {
              let value = row[index];
              
              console.log(`Processing ${fieldName} from column "${header}":`, value);
              
              // Type conversions based on field
              if (['totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'projectedRevenueGrowth', 'burnMultiple', 'runway', 'additionalInvestmentRequested', 'preMoneyValuation', 'postMoneyValuation', 'roundComplexity', 'exitTimeline', 'revenue', 'arr', 'caEquityValuation', 'totalRaiseRequest', 'amountRequestedFromFirm', 'revenueYearMinus2', 'revenueYearMinus1', 'currentRevenue', 'projectedRevenueYear1', 'projectedRevenueYear2', 'currentARR'].includes(fieldName)) {
                // Clean the value for number parsing
                let cleanValue = String(value).replace(/[$,\s%]/g, '');
                console.log(`Cleaned value for ${fieldName}:`, cleanValue);
                
                // Handle empty strings or non-numeric values
                if (cleanValue === '' || cleanValue === '-' || cleanValue === 'N/A') {
                  value = null;
                } else {
                  const parsedValue = parseFloat(cleanValue);
                  if (isNaN(parsedValue)) {
                    value = null;
                  } else {
                    value = parsedValue;
                    // Scale only totalInvestment from thousands to actual dollars
                    if (fieldName === 'totalInvestment') {
                      value = parsedValue * 1000;
                      console.log(`Scaled ${fieldName} from ${parsedValue}k to ${value}`);
                    }
                    // Scale CA Equity Valuation from thousands to actual dollars
                    else if (fieldName === 'caEquityValuation') {
                      value = parsedValue * 1000;
                      console.log(`Scaled ${fieldName} from ${parsedValue}k to ${value}`);
                    }
                    // Revenue and valuation fields - keep raw values, no auto-scaling
                    else if (['preMoneyValuation', 'postMoneyValuation', 'revenue', 'arr', 'revenueYearMinus2', 'revenueYearMinus1', 'currentRevenue', 'projectedRevenueYear1', 'projectedRevenueYear2', 'currentARR'].includes(fieldName)) {
                      // Store raw values - let the UI handle formatting
                      value = parsedValue;
                      console.log(`Set ${fieldName} to raw value: ${value}`);
                    }
                    // Convert equity stake from decimal to percentage if needed
                    else if (fieldName === 'equityStake' && parsedValue < 1) {
                      value = parsedValue * 100;
                      console.log(`Converted equity stake from ${parsedValue} to ${value}%`);
                    }
                    // Convert revenue growth - detect if input is decimal (0.1 = 10%) or percentage (10 = 10%)
                    else if (fieldName === 'revenueGrowth' || fieldName === 'projectedRevenueGrowth') {
                      const originalString = String(row[index]);
                      
                      // If original string contained %, the numeric value is already a percentage
                      if (originalString.includes('%')) {
                        value = parsedValue;
                        console.log(`Kept ${fieldName} as percentage from % input: ${value}%`);
                      }
                      // If value is between 0 and 1, it's likely a decimal (0.1 = 10%)
                      else if (parsedValue > 0 && parsedValue < 1) {
                        value = parsedValue * 100;
                        console.log(`Converted ${fieldName} from decimal ${parsedValue} to ${value}%`);
                      }
                      // For values >= 1, assume they're already percentages (handles large values like 2200%)
                      else {
                        value = parsedValue;
                        console.log(`Kept ${fieldName} as percentage: ${value}%`);
                      }
                    }
                    // Handle round complexity (validate 1-5 scale)
                    else if (fieldName === 'roundComplexity') {
                      if (parsedValue >= 1 && parsedValue <= 5) {
                        value = Math.round(parsedValue); // Ensure integer
                      } else {
                        console.warn(`Invalid round complexity value for ${company.companyName}: ${parsedValue}. Must be 1-5.`);
                        value = 3; // Default to neutral
                      }
                    }
                    // Handle exit timeline (validate positive numbers, default to 3)
                    else if (fieldName === 'exitTimeline') {
                      if (parsedValue > 0 && parsedValue <= 20) {
                        value = Math.round(parsedValue); // Ensure integer years
                      } else {
                        console.warn(`Invalid exit timeline value for ${company.companyName}: ${parsedValue}. Must be positive and ≤20 years.`);
                        value = 3; // Default to 3 years
                      }
                    }
                  }
                }
              } else if (['tam', 'barrierToEntry', 'investorInterest', 'roundComplexity'].includes(fieldName)) {
                let cleanValue = String(value).replace(/[^0-9]/g, '');
                if (fieldName === 'investorInterest') {
                  const parsedValue = parseInt(cleanValue);
                  value = (parsedValue >= 1 && parsedValue <= 5) ? parsedValue : null;
                } else if (fieldName === 'roundComplexity') {
                  const parsedValue = parseInt(cleanValue);
                  if (parsedValue >= 1 && parsedValue <= 5) {
                    value = parsedValue;
                  } else {
                    console.warn(`Invalid round complexity value: ${parsedValue}. Defaulting to 3.`);
                    value = 3; // Default to neutral
                  }
                } else {
                  value = parseInt(cleanValue) || 1;
                }
              } else if (fieldName === 'seriesStage') {
                // Handle Series/Stage field - normalize common variations
                let stageValue = String(value).trim();
                
                // Normalize common variations
                const normalizedStage = stageValue.toLowerCase();
                if (normalizedStage === 'seed' || normalizedStage === 'pre-seed') {
                  value = 'Seed';
                } else if (normalizedStage.includes('series a') || normalizedStage === 'a') {
                  value = 'Series A';
                } else if (normalizedStage.includes('series b') || normalizedStage === 'b') {
                  value = 'Series B';
                } else if (normalizedStage.includes('series c') || normalizedStage === 'c') {
                  value = 'Series C';
                } else if (normalizedStage === 'growth' || normalizedStage === 'late stage') {
                  value = 'Growth';
                } else if (stageValue === '' || stageValue === '-' || stageValue === 'N/A' || stageValue === 'TBD') {
                  value = null; // Fail-safe for missing data
                } else {
                  // Keep original value for other valid stages
                  value = stageValue;
                }
                console.log(`Normalized series/stage from "${row[index]}" to "${value}"`);
              } else if (typeof value !== 'string') {
                value = String(value);
              }
              
              company[fieldName] = value;
              console.log(`Set ${fieldName} =`, value);
            }
          });
          
          // Set default exit timeline if not provided
          if (!company.exitTimeline) {
            company.exitTimeline = 3; // Default to 3 years
            console.log(`Setting default exit timeline of 3 years for ${company.companyName}`);
          }

          // Validate required fields
          if (company.companyName) {
            // Ensure numeric fields have defaults for investment status detection
            const totalInvestment = company.totalInvestment || 0;
            const equityStake = company.equityStake || 0;
            const caEquityValuation = company.caEquityValuation || null;
            
            // Detect investment status
            company.isExistingInvestment = detectInvestmentStatus(totalInvestment, equityStake, caEquityValuation);
            
            // Validate fundraising data consistency
            if (company.amountRequestedFromFirm && company.totalRaiseRequest && 
                company.amountRequestedFromFirm > company.totalRaiseRequest) {
              console.warn(`Data inconsistency for ${company.companyName}: Amount requested (${company.amountRequestedFromFirm}) exceeds total raise (${company.totalRaiseRequest})`);
            }
            
            // Apply revenue analytics calculations
            const enhancedCompany = enhanceCompanyWithAnalytics(company);
            companies.push(enhancedCompany);
          }
        }
        
        if (companies.length === 0) {
          throw new Error('No valid company data found in Excel file');
        }
        
        console.log(`Successfully parsed ${companies.length} companies`);
        console.log('Sample company data:', companies[0]);
        resolve(companies);
        
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
