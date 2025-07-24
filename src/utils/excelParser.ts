
import * as XLSX from 'xlsx';

export interface RawCompanyData {
  id: string;
  companyName: string;
  totalInvestment: number;
  equityStake: number;
  moic: number | null;
  revenueGrowth: number | null;
  burnMultiple: number | null;
  runway: number | null;
  tam: number;
  exitActivity: string;
  barrierToEntry: number;
  additionalInvestmentRequested: number;
  industry: string;
  investorInterest: number | null;
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
  'Ability to Raise Capital': 'investorInterest'
};

// Enhanced keyword mappings for better fuzzy matching
const KEYWORD_MAPPINGS: { [key: string]: string[] } = {
  'companyName': ['company', 'name'],
  'totalInvestment': ['total', 'investment', 'thousands'],
  'equityStake': ['equity', 'stake', 'fully', 'diluted', 'percent'],
  'moic': ['moic', 'implied'],
  'revenueGrowth': ['ttm', 'revenue', 'growth'],
  'burnMultiple': ['burn', 'multiple', 'rate', 'arr'],
  'runway': ['runway', 'months'],
  'tam': ['tam', 'rating', 'competitive', 'growing', 'market'],
  'exitActivity': ['exit', 'activity', 'sector', 'high', 'moderate', 'low'],
  'barrierToEntry': ['barrier', 'entry', 'advantage', 'firms', 'enter'],
  'additionalInvestmentRequested': ['additional', 'investment', 'request'],
  'industry': ['industry', 'sector'],
  'investorInterest': ['investor', 'interest', 'ability', 'raise', 'capital']
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
  const fieldsToMap = ['companyName', 'totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'burnMultiple', 'runway', 'tam', 'exitActivity', 'barrierToEntry', 'additionalInvestmentRequested', 'industry', 'investorInterest'];
  
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
              if (['totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'burnMultiple', 'runway', 'additionalInvestmentRequested'].includes(fieldName)) {
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
                    // Convert equity stake from decimal to percentage if needed
                    else if (fieldName === 'equityStake' && parsedValue < 1) {
                      value = parsedValue * 100;
                      console.log(`Converted equity stake from ${parsedValue} to ${value}%`);
                    }
                    // Convert revenue growth from decimal to percentage if needed
                    else if (fieldName === 'revenueGrowth' && parsedValue < 10) {
                      value = parsedValue * 100;
                      console.log(`Converted revenue growth from ${parsedValue} to ${value}%`);
                    }
                  }
                }
              } else if (['tam', 'barrierToEntry', 'investorInterest'].includes(fieldName)) {
                let cleanValue = String(value).replace(/[^0-9]/g, '');
                if (fieldName === 'investorInterest') {
                  const parsedValue = parseInt(cleanValue);
                  value = (parsedValue >= 1 && parsedValue <= 5) ? parsedValue : null;
                } else {
                  value = parseInt(cleanValue) || 1;
                }
              } else if (typeof value !== 'string') {
                value = String(value);
              }
              
              company[fieldName] = value;
              console.log(`Set ${fieldName} =`, value);
            }
          });
          
          // Validate required fields
          if (company.companyName) {
            companies.push(company);
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
