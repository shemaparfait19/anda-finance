import type { Member, Transaction, SavingsAccount, Loan, CashbookEntry, Investment, AuditLog, User } from "./types";
import membersData from '@/data/members.json';
import transactionsData from '@/data/transactions.json';
import savingsAccountsData from '@/data/savings.json';
import loansData from '@/data/loans.json';
import cashbookData from '@/data/cashbook.json';
import investmentsData from '@/data/investments.json';
import auditLogsData from '@/data/audit.json';
import usersData from '@/data/users.json';


export const members: Member[] = membersData;
export const transactions: Transaction[] = transactionsData;
export const savingsAccounts: SavingsAccount[] = savingsAccountsData;
export const loans: Loan[] = loansData;
export const income: CashbookEntry[] = cashbookData.income;
export const expenses: CashbookEntry[] = cashbookData.expenses;
export const chartData = [
  { month: "Jan", savings: 40000, loans: 24000 },
  { month: "Feb", savings: 30000, loans: 13980 },
  { month: "Mar", savings: 20000, loans: 98000 },
  { month: "Apr", savings: 27800, loans: 39080 },
  { month: "May", savings: 18900, loans: 48000 },
  { month: "Jun", savings: 23900, loans: 38000 },
  { month: "Jul", savings: 34900, loans: 43000 },
];
export const investments: Investment[] = investmentsData;
export const auditLogs: AuditLog[] = auditLogsData;
export const users: User[] = usersData;
