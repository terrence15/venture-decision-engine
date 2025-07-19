
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

export function parseExcelFile(file: File): Promise<RawCompanyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
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
        
        // Validate required columns
        const missingColumns = Object.keys(COLUMN_MAPPINGS).filter(
          col => !headers.includes(col)
        );
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
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
          
          // Map each column to our data structure
          headers.forEach((header, index) => {
            const fieldName = COLUMN_MAPPINGS[header as keyof typeof COLUMN_MAPPINGS];
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
