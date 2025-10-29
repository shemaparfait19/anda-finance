import type { LucideIcon } from "lucide-react";

export type Member = {
  id: string;
  name: string; // This will now be a concatenation of firstName and lastName
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  nationalId?: string;
  phoneNumber: string;
  email?: string;
  alternativePhone?: string;
  address?: string;
  monthlyContribution?: number;
  profilePhotoPath?: string;
  nationalIdCopyPath?: string;
  memberId: string;
  contributionDate?: string;
  collectionMeans?: "MOMO" | "AIRTEL MONEY" | "BANKS IN RWANDA" | "OTHER";
  otherCollectionMeans?: string;
  accountNumber?: string;
  savingsBalance: number;
  loanBalance: number;
  status: "Active" | "Inactive" | "Dormant" | "Closed";
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
  status: "Active" | "Paid" | "Overdue" | "Defaulted" | "Pending";
  loanTerm?: number;
  loanPurpose?: string;
  purposeDescription?: string;
};

export type CashbookEntry = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
};

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type Investment = {
  id: string;
  name: string;
  type: "Stock" | "Real Estate" | "Bond" | "Agribusiness";
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
  role: "Admin" | "Manager" | "Teller" | "Auditor";
};

export type Report = {
  id: string;
  title: string;
  type: "financial" | "member" | "loan" | "savings" | "audit";
  period: string;
  generatedDate: string;
  data: Record<string, any>;
  status: "draft" | "completed" | "archived";
};

export type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  type: "loan_repayment" | "savings_deposit" | "fee_payment" | "withdrawal";
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "mobile_money" | "bank_transfer" | "check";
  reference: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description?: string;
};

export type Account = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  balance: number;
  lastUpdated: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  description: string;
  reference: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
};

export type AccountingData = {
  accounts: Account[];
  journalEntries: JournalEntry[];
};
