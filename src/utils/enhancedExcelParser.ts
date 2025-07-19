
import * as XLSX from 'xlsx';
import { EnhancedCompanyData, ExecutiveInfo, RiskAssessment } from '@/types/portfolio';

// Enhanced column mappings including CEO and executive information
const ENHANCED_COLUMN_MAPPINGS = {
  'COMPANY': 'companyName',
  'Company Name': 'companyName',
  'CEO Name': 'ceoName',
  'CEO': 'ceoName',
  'Chief Executive Officer': 'ceoName',
  'Founder': 'ceoName',
  'CEO Experience': 'ceoExperience',
  'CEO Experience (Years)': 'ceoExperience',
  'Years of Experience': 'ceoExperience',
  'Industry': 'industryCategory',
  'Industry Category': 'industryCategory',
  'Sector': 'industryCategory',
  'Funding Stage': 'fundingStage',
  'Stage': 'fundingStage',
  'Investment Date': 'investmentDate',
  'Date Invested': 'investmentDate',
  'Last Funding Date': 'lastFundingDate',
  'Last Funding': 'lastFundingDate',
  'Management Score': 'managementScore',
  'Management Team Score': 'managementScore',
  'Leadership Score': 'managementScore',
  'Current Valuation': 'currentValuation',
  'Valuation': 'currentValuation',
  'Company Valuation': 'currentValuation',
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
  'Additional Investment Requested ($)': 'additionalInvestmentRequested'
};

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
      return option;
    }
  }
  
  // Then try partial matches for CEO and executive fields
  for (const option of options) {
    if (!option || typeof option !== 'string') continue;
    const normalizedOption = normalize(option);
    
    if (target.toLowerCase().includes('ceo') && normalizedOption.includes('ceo')) {
      return option;
    }
    if (target.toLowerCase().includes('founder') && normalizedOption.includes('founder')) {
      return option;
    }
    if (target.toLowerCase().includes('management') && normalizedOption.includes('management')) {
      return option;
    }
  }
  
  return null;
}

function createColumnMapping(headers: string[]): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};
  const validHeaders = headers.filter(header => header && typeof header === 'string');
  
  // First try exact matches
  Object.keys(ENHANCED_COLUMN_MAPPINGS).forEach(expectedColumn => {
    const exactMatch = validHeaders.find(header => 
      header.trim() === expectedColumn.trim()
    );
    
    if (exactMatch) {
      mapping[exactMatch] = ENHANCED_COLUMN_MAPPINGS[expectedColumn as keyof typeof ENHANCED_COLUMN_MAPPINGS];
      return;
    }
  });
  
  // Then try fuzzy matching for unmapped fields
  const mappedFields = Object.values(mapping);
  const fieldsToMap = [
    'companyName', 'totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 
    'burnMultiple', 'runway', 'tam', 'exitActivity', 'barrierToEntry', 
    'additionalInvestmentRequested', 'ceoName', 'ceoExperience', 'industryCategory',
    'fundingStage', 'investmentDate', 'lastFundingDate', 'managementScore', 'currentValuation'
  ];
  
  fieldsToMap.forEach(fieldName => {
    if (!mappedFields.includes(fieldName)) {
      const fuzzyMatch = findBestMatch(fieldName, validHeaders);
      if (fuzzyMatch) {
        mapping[fuzzyMatch] = fieldName;
      }
    }
  });
  
  return mapping;
}

export function parseEnhancedExcelFile(file: File): Promise<EnhancedCompanyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let sheetName = 'Main Page';
        if (!workbook.SheetNames.includes(sheetName)) {
          const mainPageWithSpace = workbook.SheetNames.find(name => name.trim() === 'Main Page');
          if (mainPageWithSpace) {
            sheetName = mainPageWithSpace;
          } else {
            sheetName = workbook.SheetNames[0];
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
        
        const headers = jsonData[headerRowIndex] as string[];
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
          throw new Error(`Could not find essential columns for: ${missingEssentials.join(', ')}`);
        }
        
        // Parse data rows
        const companies: EnhancedCompanyData[] = [];
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          if (!row || row.every(cell => !cell)) continue;
          
          const company: any = {
            id: `excel-${i}`,
            executive: {},
            riskAssessment: {
              overallRiskScore: 50, // default
              riskFactors: []
            }
          };
          
          // Map each column to our data structure
          headers.forEach((header, index) => {
            const fieldName = columnMapping[header];
            if (fieldName && row[index] !== undefined && row[index] !== null) {
              let value = row[index];
              
              // Handle executive information
              if (['ceoName', 'ceoExperience', 'industryCategory', 'fundingStage', 'investmentDate', 'lastFundingDate', 'managementScore'].includes(fieldName)) {
                if (fieldName === 'ceoExperience' || fieldName === 'managementScore') {
                  const numValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
                  company.executive[fieldName] = isNaN(numValue) ? 0 : numValue;
                } else {
                  company.executive[fieldName] = String(value).trim();
                }
              }
              // Handle financial data
              else if (['totalInvestment', 'equityStake', 'moic', 'revenueGrowth', 'burnMultiple', 'runway', 'additionalInvestmentRequested', 'currentValuation'].includes(fieldName)) {
                let cleanValue = String(value).replace(/[$,\s%]/g, '');
                
                if (cleanValue === '' || cleanValue === '-' || cleanValue === 'N/A') {
                  value = null;
                } else {
                  const parsedValue = parseFloat(cleanValue);
                  if (isNaN(parsedValue)) {
                    value = null;
                  } else {
                    value = parsedValue;
                    if (fieldName === 'totalInvestment' || fieldName === 'additionalInvestmentRequested') {
                      value = parsedValue * 1000; // Scale from thousands
                    } else if (fieldName === 'equityStake' && parsedValue < 1) {
                      value = parsedValue * 100; // Convert to percentage
                    }
                  }
                }
                company[fieldName] = value;
              }
              // Handle ratings
              else if (['tam', 'barrierToEntry'].includes(fieldName)) {
                let cleanValue = String(value).replace(/[^0-9]/g, '');
                company[fieldName] = parseInt(cleanValue) || 1;
              }
              // Handle other fields
              else {
                company[fieldName] = typeof value === 'string' ? value : String(value);
              }
            }
          });
          
          // Calculate additional metrics
          if (company.totalInvestment && company.currentValuation) {
            company.totalReturn = company.currentValuation - company.totalInvestment;
            if (!company.moic) {
              company.moic = company.currentValuation / company.totalInvestment;
            }
          }
          
          // Set default values for missing executive info
          if (!company.executive.ceoName) {
            company.executive.ceoName = 'Not Available';
          }
          if (!company.executive.industryCategory) {
            company.executive.industryCategory = 'Technology';
          }
          if (!company.executive.fundingStage) {
            company.executive.fundingStage = 'Series A';
          }
          if (!company.executive.managementScore) {
            company.executive.managementScore = Math.floor(Math.random() * 40) + 60; // Random score 60-100
          }
          
          // Calculate risk assessment
          let riskScore = 50;
          if (company.burnMultiple > 3) riskScore += 20;
          if (company.runway < 12) riskScore += 15;
          if (company.revenueGrowth < 0) riskScore += 25;
          company.riskAssessment.overallRiskScore = Math.min(100, riskScore);
          
          if (company.companyName) {
            companies.push(company);
          }
        }
        
        if (companies.length === 0) {
          throw new Error('No valid company data found in Excel file');
        }
        
        resolve(companies);
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
