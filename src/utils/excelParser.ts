
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
}

// Column mapping from Excel to our data structure
const COLUMN_MAPPINGS = {
  'Company Name': 'companyName',
  'Total Investment to Date': 'totalInvestment',
  'Equity Stake (FD %)': 'equityStake',
  'MOIC': 'moic',
  'TTM Revenue Growth': 'revenueGrowth',
  'Burn Multiple': 'burnMultiple',
  'Runway': 'runway',
  'TAM (1–5)': 'tam',
  'Exit Activity in Sector': 'exitActivity',
  'Barrier to Entry (1–5)': 'barrierToEntry',
  'Additional Investment Requested': 'additionalInvestmentRequested'
};

// Fuzzy matching function to find similar column names
function findBestMatch(target: string, options: string[]): string | null {
  const normalize = (str: string) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };
  
  const normalizedTarget = normalize(target);
  
  // Enhanced keyword matching for better fuzzy matching
  const keywordMappings: { [key: string]: string[] } = {
    'companyname': ['company'],
    'totalinvestment': ['total', 'investment', 'thousands'],
    'equitystake': ['equity', 'stake', 'fully', 'diluted'],
    'moic': ['moic', 'implied'],
    'revenuegrowth': ['ttm', 'revenue', 'growth'],
    'burnmultiple': ['burn', 'multiple', 'rate', 'arr'],
    'runway': ['runway', 'months'],
    'tam': ['tam', 'rating', 'competitive', 'growing', 'market'],
    'exitactivity': ['exit', 'activity', 'sector', 'high', 'moderate', 'low'],
    'barriertoentry': ['barrier', 'entry', 'advantage', 'firms', 'enter'],
    'additionalinvestment': ['additional', 'investment', 'request']
  };
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const option of options) {
    if (!option || typeof option !== 'string') continue;
    
    const normalizedOption = normalize(option);
    
    // Check for exact match after normalization
    if (normalizedTarget === normalizedOption) {
      return option;
    }
    
    // Check keyword matching
    const targetKeywords = keywordMappings[normalizedTarget] || [];
    for (const keyword of targetKeywords) {
      if (normalizedOption.includes(keyword)) {
        const score = keyword.length / normalizedOption.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = option;
        }
      }
    }
    
    // Check for substring match
    if (normalizedTarget.includes(normalizedOption) || normalizedOption.includes(normalizedTarget)) {
      const score = Math.min(normalizedTarget.length, normalizedOption.length) / Math.max(normalizedTarget.length, normalizedOption.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = option;
      }
    }
    
    // Simple similarity score based on common characters
    const commonChars = normalizedTarget.split('').filter(char => normalizedOption.includes(char)).length;
    const score = commonChars / Math.max(normalizedTarget.length, normalizedOption.length);
    
    if (score > 0.4 && score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }
  
  return bestScore > 0.3 ? bestMatch : null;
}

// Create fuzzy column mapping
function createFuzzyMapping(headers: string[]): { [key: string]: string } {
  const fuzzyMapping: { [key: string]: string } = {};
  
  // Filter out undefined/null headers
  const validHeaders = headers.filter(header => header && typeof header === 'string');
  console.log('Valid headers after filtering:', validHeaders);
  
  Object.keys(COLUMN_MAPPINGS).forEach(expectedColumn => {
    const match = findBestMatch(expectedColumn, validHeaders);
    if (match) {
      fuzzyMapping[match] = COLUMN_MAPPINGS[expectedColumn as keyof typeof COLUMN_MAPPINGS];
      console.log(`Mapped "${match}" → "${expectedColumn}"`);
    }
  });
  
  return fuzzyMapping;
}

export function parseExcelFile(file: File): Promise<RawCompanyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('FileReader onload triggered');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Look for "Main Page" sheet first, fallback to first sheet
        let sheetName = 'Main Page';
        if (!workbook.SheetNames.includes(sheetName)) {
          sheetName = workbook.SheetNames[0];
          console.log(`"Main Page" sheet not found, using "${sheetName}" instead`);
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel file must contain at least a header row and one data row');
        }
        
        // Extract headers (first row)
        const headers = jsonData[0] as string[];
        console.log('Raw headers found:', headers);
        console.log('Headers length:', headers.length);
        
        // Create fuzzy column mapping
        const fuzzyMapping = createFuzzyMapping(headers);
        console.log('Fuzzy mapping created:', fuzzyMapping);
        console.log('Mapped fields:', Object.values(fuzzyMapping));
        
        // Check if we found enough essential columns
        const essentialFields = ['companyName', 'totalInvestment', 'equityStake'];
        const foundEssentials = essentialFields.filter(field => 
          Object.values(fuzzyMapping).includes(field)
        );
        console.log('Essential fields found:', foundEssentials);
        console.log('Missing essentials:', essentialFields.filter(field => !foundEssentials.includes(field)));
        
        if (foundEssentials.length < essentialFields.length) {
          const missingEssentials = essentialFields.filter(field => 
            !Object.values(fuzzyMapping).includes(field)
          );
          throw new Error(`Could not find essential columns for: ${missingEssentials.join(', ')}. Available headers: ${headers.join(', ')}`);
        }
        
        // Parse data rows
        const companies: RawCompanyData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Skip empty rows
          if (!row || row.every(cell => !cell)) continue;
          
          const company: any = {
            id: `excel-${i}`,
          };
          
          // Map each column to our data structure using fuzzy mapping
          headers.forEach((header, index) => {
            const fieldName = fuzzyMapping[header];
            if (fieldName && row[index] !== undefined && row[index] !== null) {
              let value = row[index];
              
              // Type conversions based on field
              if (['totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'burnMultiple', 'runway', 'additionalInvestmentRequested'].includes(fieldName)) {
                value = parseFloat(value) || null;
              } else if (['tam', 'barrierToEntry'].includes(fieldName)) {
                value = parseInt(value) || 1;
              } else if (typeof value !== 'string') {
                value = String(value);
              }
              
              company[fieldName] = value;
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
        
        console.log(`Successfully parsed ${companies.length} companies from Excel`);
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
