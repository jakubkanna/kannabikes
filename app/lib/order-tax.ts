const KANNA_VAT_RATE = 0.23;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getInclusiveTaxBreakdown(grossAmount: number) {
  const normalizedGrossAmount = Math.max(0, grossAmount);
  const taxAmount = roundCurrency(
    normalizedGrossAmount - normalizedGrossAmount / (1 + KANNA_VAT_RATE),
  );
  const netAmount = roundCurrency(normalizedGrossAmount - taxAmount);

  return {
    grossAmount: roundCurrency(normalizedGrossAmount),
    netAmount,
    taxAmount,
    taxLabel: "VAT (23% included)",
  };
}

export function formatOrderMoney(amount: number, currency: string) {
  const normalizedAmount = roundCurrency(amount);
  const hasDecimals = Math.abs(normalizedAmount % 1) > 0;

  return `${normalizedAmount
    .toLocaleString("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })
    .replace(/,/g, " ")} ${currency}`;
}
