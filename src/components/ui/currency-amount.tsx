
import React from 'react';

interface CurrencyAmountProps {
  amount: number;
  currency?: string;
  className?: string;
  showPlusSign?: boolean;
  showCurrency?: boolean;
  animated?: boolean;
  compact?: boolean;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  currency = 'USD',
  className = '',
  showPlusSign = false,
  showCurrency = true,
  animated = false,
  compact = false,
}) => {
  // Currency symbols map
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    RUB: '₽',
    BRL: 'R$',
  };

  const symbol = currencySymbols[currency] || '$';
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  // Format the number according to locale with appropriate precision
  const formattedAmount = compact 
    ? new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(absoluteAmount)
    : new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absoluteAmount);
  
  // Add plus sign if requested and amount is positive
  const signPrefix = !isNegative && showPlusSign ? '+' : '';
  const negativePrefix = isNegative ? '-' : '';
  const currencyPrefix = showCurrency ? symbol : '';
  
  const displayValue = `${negativePrefix}${currencyPrefix}${formattedAmount}`;
  
  return (
    <span 
      className={`font-mono ${isNegative ? 'text-unplayed-pink' : 'text-unplayed-mint'} ${className}`}
      data-animated={animated ? "true" : "false"}
      data-value={amount}
    >
      {displayValue}
    </span>
  );
};

export default CurrencyAmount;
