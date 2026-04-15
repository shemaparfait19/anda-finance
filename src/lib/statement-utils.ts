import type { Member, Loan } from "./types";

// ── Configurable group constants ─────────────────────────────────────────────
// These reflect the group's rules confirmed by the PM.
// Share price: 15,000 RWF buys one share.
export const SHARE_PRICE = 15_000;
// Annual interest rate applied to the principal savings balance.
export const SAVINGS_INTEREST_RATE = 0.08; // 8%
// Fraction of total savings (principal + interest) eligible for a loan.
export const LOAN_ELIGIBILITY_RATE = 0.80; // 80%
// Default interest rate offered on loans.
export const LOAN_INTEREST_RATE = 3; // 3%

// ── Statement data types ──────────────────────────────────────────────────────
export type StatementData = {
  // Member info
  memberName: string;
  memberId: string;
  accountNumber: string;
  statementDate: string;
  status: string;
  // Savings section
  principal: number;
  interest: number;
  total: number;
  principalShares: number;
  interestShares: number;
  totalShares: number;
  // Loan eligibility
  loanEligibility: number;
  // Loans
  loans: {
    label: string;
    principal: number;
    balance: number;
    status: string;
    issueDate: string;
    dueDate: string;
    interestRate: number;
    loanId: string;
  }[];
  totalCurrentLoans: number;
  totalDebts: number;
};

// ── Main calculation function ─────────────────────────────────────────────────
export function buildStatementData(
  member: Member,
  memberLoans: Loan[]
): StatementData {
  const principal = member.savingsBalance;
  const interest = Math.round(principal * SAVINGS_INTEREST_RATE);
  const total = principal + interest;

  const principalShares = principal / SHARE_PRICE;
  const interestShares = interest / SHARE_PRICE;
  const totalShares = total / SHARE_PRICE;

  const loanEligibility = Math.round(total * LOAN_ELIGIBILITY_RATE);

  // Active/overdue loans represent current debt
  const activeLoans = memberLoans.filter(
    (l) => l.status === "Active" || l.status === "Overdue" || l.status === "Defaulted"
  );
  const totalCurrentLoans = activeLoans.reduce((sum, l) => sum + l.balance, 0);

  // Label loans as "1st Loan", "2nd Loan", etc. ordered by issue date
  const sortedLoans = [...memberLoans].sort(
    (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
  );

  const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const loansWithLabels = sortedLoans.map((loan, i) => ({
    label: `${ORDINALS[i] ?? `${i + 1}th`} Loan`,
    principal: loan.principal,
    balance: loan.balance,
    status: loan.status,
    issueDate: loan.issueDate,
    dueDate: loan.dueDate,
    interestRate: loan.interestRate,
    loanId: loan.loanId,
  }));

  return {
    memberName: member.name,
    memberId: member.memberId,
    accountNumber: member.accountNumber ?? member.memberId,
    statementDate: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    status: member.status,
    principal,
    interest,
    total,
    principalShares,
    interestShares,
    totalShares,
    loanEligibility,
    loans: loansWithLabels,
    totalCurrentLoans,
    totalDebts: totalCurrentLoans, // can be extended with fees/charges later
  };
}
