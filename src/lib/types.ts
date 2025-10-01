import type { LucideIcon } from "lucide-react";

export type Member = {
  id: string;
  name: string;
  memberId: string;
  joinDate: string;
  savingsBalance: number;
  loanBalance: number;
  status: "Active" | "Inactive";
  avatarId: string;
};

export type Transaction = {
  id: string;
  member: {
    name: string;
    avatarId: string;
  };
  type: "Deposit" | "Withdrawal" | "Loan Repayment" | "Loan Disbursement";
  amount: number;
  date: string;
  status: "Completed" | "Pending" | "Failed";
};

export type SavingsAccount = {
  id: string;
  memberId: string;
  memberName: string;
  accountNumber: string;
  type: "Compulsory" | "Voluntary";
  balance: number;
  openDate: string;
};

export type Loan = {
  id: string;
  memberId: string;
  memberName: string;
  loanId: string;
  principal: number;
  balance: number;
  interestRate: number;
  issueDate: string;
  dueDate: string;
  status: "Active" | "Paid" | "Overdue" | "Defaulted";
};

export type CashbookEntry = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
};

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type Investment = {
  id: string;
  name: string;
  type: 'Stock' | 'Real Estate' | 'Bond' | 'Agribusiness';
  amountInvested: number;
  currentValue: number;
  purchaseDate: string;
  returnOnInvestment: number;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  user: {
    name: string;
    avatarId: string;
  };
  action: string;
  details: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Teller' | 'Auditor';
}
