/**
 * Smart number formatting utilities for financial data
 * Handles proper scaling and formatting for billions, millions, thousands
 */

export interface FormattedNumber {
  value: string;
  raw: number;
  scale: 'B' | 'M' | 'K' | '';
}

/**
 * Formats large numbers with appropriate scaling (B/M/K)
 * @param amount - The number to format
 * @param options - Formatting options
 */
export function formatLargeNumber(
  amount: number | null | undefined,
  options: {
    currency?: boolean;
    decimals?: number;
    forceScale?: 'B' | 'M' | 'K' | '';
  } = {}
): FormattedNumber {
  const { currency = false, decimals = 1, forceScale } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return { value: 'N/A', raw: 0, scale: '' };
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const currencySymbol = currency ? '$' : '';

  // Determine scale
  let scale: 'B' | 'M' | 'K' | '';
  let divisor: number;
  
  if (forceScale) {
    scale = forceScale;
    switch (forceScale) {
      case 'B': divisor = 1000000000; break;
      case 'M': divisor = 1000000; break;
      case 'K': divisor = 1000; break;
      default: divisor = 1; break;
    }
  } else {
    if (absAmount >= 1000000000) {
      scale = 'B';
      divisor = 1000000000;
    } else if (absAmount >= 1000000) {
      scale = 'M';
      divisor = 1000000;
    } else if (absAmount >= 1000) {
      scale = 'K';
      divisor = 1000;
    } else {
      scale = '';
      divisor = 1;
    }
  }

  const scaledValue = amount / divisor;
  
  // Format the number
  let formattedValue: string;
  if (scale === '' && currency) {
    // For small amounts with currency, use standard formatting
    formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    // For scaled amounts
    const decimalPlaces = decimals === 0 || scaledValue % 1 === 0 ? 0 : decimals;
    formattedValue = `${sign}${currencySymbol}${scaledValue.toFixed(decimalPlaces)}${scale}`;
  }

  return {
    value: formattedValue,
    raw: amount,
    scale
  };
}

/**
 * Formats currency with smart scaling
 */
export function formatCurrency(amount: number | null | undefined): string {
  return formatLargeNumber(amount, { currency: true }).value;
}

/**
 * Formats revenue values, handling both regular revenue and ARR
 */
export function formatRevenue(
  revenue: number | null | undefined, 
  arr: number | null | undefined
): { value: string; type: string; primary: boolean } {
  // Prioritize ARR if it's larger or if revenue is null/undefined
  const hasValidARR = arr !== null && arr !== undefined && arr > 0;
  const hasValidRevenue = revenue !== null && revenue !== undefined && revenue > 0;
  
  if (!hasValidARR && !hasValidRevenue) {
    return { value: 'N/A', type: 'N/A', primary: false };
  }
  
  // Use ARR if it's the only one available, or if it's significantly larger than revenue
  const useARR = hasValidARR && (!hasValidRevenue || (arr && revenue && arr > revenue * 1.2));
  
  if (useARR && arr) {
    return {
      value: formatCurrency(arr),
      type: 'ARR',
      primary: true
    };
  } else if (hasValidRevenue && revenue) {
    return {
      value: formatCurrency(revenue),
      type: 'Revenue',
      primary: true
    };
  }
  
  return { value: 'N/A', type: 'N/A', primary: false };
}

/**
 * Validates if a number seems reasonable for a revenue field
 * Returns warnings for suspicious values
 */
export function validateRevenueAmount(
  amount: number,
  fieldName: string
): { isValid: boolean; warning?: string } {
  if (amount < 0) {
    return { isValid: false, warning: `${fieldName} cannot be negative` };
  }
  
  if (amount > 0 && amount < 1000) {
    return { 
      isValid: true, 
      warning: `${fieldName} of $${amount} seems unusually low - verify this is not in thousands or millions` 
    };
  }
  
  if (amount > 50000000000) { // $50B
    return { 
      isValid: true, 
      warning: `${fieldName} of ${formatCurrency(amount)} seems unusually high for a startup` 
    };
  }
  
  return { isValid: true };
}

/**
 * Smart unit detection for Excel parsing
 * Attempts to detect if values are in raw dollars, thousands, or millions
 */
export function detectValueUnit(
  values: number[],
  columnHeader?: string
): { unit: 'dollars' | 'thousands' | 'millions'; confidence: number } {
  const validValues = values.filter(v => v > 0);
  
  if (validValues.length === 0) {
    return { unit: 'dollars', confidence: 0 };
  }
  
  // Check header for unit indicators
  const header = (columnHeader || '').toLowerCase();
  if (header.includes('(m)') || header.includes('millions')) {
    return { unit: 'millions', confidence: 0.9 };
  }
  if (header.includes('(k)') || header.includes('thousands')) {
    return { unit: 'thousands', confidence: 0.9 };
  }
  if (header.includes('($)') || header.includes('dollars')) {
    return { unit: 'dollars', confidence: 0.9 };
  }
  
  // Analyze value ranges
  const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const max = Math.max(...validValues);
  const min = Math.min(...validValues);
  
  // If most values are < 1000 and we're dealing with revenue-like fields
  if (max < 1000 && avg < 500) {
    return { unit: 'millions', confidence: 0.7 };
  }
  
  // If values are in reasonable thousands range (1K-999K)
  if (min >= 1000 && max < 1000000 && avg > 10000) {
    return { unit: 'thousands', confidence: 0.6 };
  }
  
  // Default to dollars
  return { unit: 'dollars', confidence: 0.5 };
}