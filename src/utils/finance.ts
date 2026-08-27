// FinWise Financial Calculation Utilities (finance.ts)

export interface AmortizationPeriod {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  totalInterestPaid: number;
}

export interface PayoffSummary {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  amortization: AmortizationPeriod[];
  monthsToPay: number;
}

/**
 * Calculates simple interest metrics
 */
export function calculateSimpleInterest(
  principal: number,
  annualRatePercent: number,
  years: number
): { totalInterest: number; totalPaid: number; monthlyPayment: number } {
  const rate = annualRatePercent / 100;
  const totalInterest = principal * rate * years;
  const totalPaid = principal + totalInterest;
  const monthlyPayment = totalPaid / (years * 12);

  return {
    totalInterest,
    totalPaid,
    monthlyPayment,
  };
}

/**
 * Calculates compound interest metrics
 */
export function calculateCompoundInterest(
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundingPeriodsPerYear: number = 12
): { totalInterest: number; totalPaid: number; monthlyPayment: number } {
  const rate = annualRatePercent / 100;
  const n = compoundingPeriodsPerYear;
  const t = years;
  
  // A = P(1 + r/n)^(nt)
  const totalPaid = principal * Math.pow(1 + rate / n, n * t);
  const totalInterest = totalPaid - principal;
  const monthlyPayment = totalPaid / (t * 12);

  return {
    totalInterest,
    totalPaid,
    monthlyPayment,
  };
}

/**
 * Generates standard and extra-payment amortization schedules
 */
export function calculateAmortization(
  principal: number,
  annualRatePercent: number,
  months: number,
  extraMonthlyPayment: number = 0
): PayoffSummary {
  const monthlyRate = annualRatePercent / 100 / 12;
  
  // Calculate standard monthly payment using amortization formula:
  // PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / months;
  } else {
    monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  const amortization: AmortizationPeriod[] = [];
  let remainingBalance = principal;
  let totalInterestPaid = 0;
  let month = 0;

  while (remainingBalance > 0.01 && month < 600) { // Safety ceiling of 50 years
    month++;
    
    // Interest for this month
    const interestPaid = remainingBalance * monthlyRate;
    
    // Payment for this month (capped at remaining balance + interest)
    const basePayment = Math.min(monthlyPayment, remainingBalance + interestPaid);
    const extraPayment = Math.min(extraMonthlyPayment, remainingBalance + interestPaid - basePayment);
    const actualPayment = basePayment + extraPayment;
    
    const principalPaid = actualPayment - interestPaid;
    
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalInterestPaid += interestPaid;

    amortization.push({
      month,
      payment: actualPayment,
      principalPaid,
      interestPaid,
      remainingBalance,
      totalInterestPaid,
    });
  }

  const totalPaid = principal + totalInterestPaid;

  return {
    monthlyPayment,
    totalPaid,
    totalInterest: totalInterestPaid,
    amortization,
    monthsToPay: month,
  };
}

/**
 * Compares a standard payoff schedule with an accelerated payoff schedule
 */
export function simulateAcceleratedPayoff(
  principal: number,
  annualRatePercent: number,
  months: number,
  extraMonthlyPayment: number
): {
  standard: PayoffSummary;
  accelerated: PayoffSummary;
  monthsSaved: number;
  interestSaved: number;
} {
  const standard = calculateAmortization(principal, annualRatePercent, months, 0);
  const accelerated = calculateAmortization(principal, annualRatePercent, months, extraMonthlyPayment);

  const monthsSaved = Math.max(0, standard.monthsToPay - accelerated.monthsToPay);
  const interestSaved = Math.max(0, standard.totalInterest - accelerated.totalInterest);

  return {
    standard,
    accelerated,
    monthsSaved,
    interestSaved,
  };
}
