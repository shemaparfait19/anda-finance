import type { Member, Transaction, SavingsAccount, Loan, CashbookEntry, Investment, AuditLog } from "./types";

export const members: Member[] = [
  {
    id: "1",
    name: "Anathalie Mukamana",
    memberId: "MEM001",
    joinDate: "2023-01-15",
    savingsBalance: 52000,
    loanBalance: 150000,
    status: "Active",
    avatarId: "avatar1",
  },
  {
    id: "2",
    name: "Jean Bosco Nsengiyumva",
    memberId: "MEM002",
    joinDate: "2023-02-20",
    savingsBalance: 78000,
    loanBalance: 0,
    status: "Active",
    avatarId: "avatar2",
  },
  {
    id: "3",
    name: "Clementine Uwera",
    memberId: "MEM003",
    joinDate: "2023-03-10",
    savingsBalance: 21010,
    loanBalance: 50000,
    status: "Active",
    avatarId: "avatar3",
  },
  {
    id: "4",
    name: "Emmanuel Habimana",
    memberId: "MEM004",
    joinDate: "2023-04-05",
    savingsBalance: 105000,
    loanBalance: 250000,
    status: "Active",
    avatarId: "avatar4",
  },
  {
    id: "5",
    name: "Solange Irakoze",
    memberId: "MEM005",
    joinDate: "2023-05-25",
    savingsBalance: 3200,
    loanBalance: 0,
    status: "Inactive",
    avatarId: "avatar5",
  },
];

export const transactions: Transaction[] = [
  {
    id: "txn1",
    member: { name: "Anathalie Mukamana", avatarId: "avatar1" },
    type: "Deposit",
    amount: 5000,
    date: "2024-07-28",
    status: "Completed",
  },
  {
    id: "txn2",
    member: { name: "Clementine Uwera", avatarId: "avatar3" },
    type: "Loan Repayment",
    amount: 12000,
    date: "2024-07-27",
    status: "Completed",
  },
  {
    id: "txn3",
    member: { name: "Emmanuel Habimana", avatarId: "avatar4" },
    type: "Loan Disbursement",
    amount: 100000,
    date: "2024-07-26",
    status: "Completed",
  },
  {
    id: "txn4",
    member: { name: "Jean Bosco Nsengiyumva", avatarId: "avatar2" },
    type: "Deposit",
    amount: 10000,
    date: "2024-07-25",
    status: "Completed",
  },
  {
    id: "txn5",
    member: { name: "Anathalie Mukamana", avatarId: "avatar1" },
    type: "Withdrawal",
    amount: 2000,
    date: "2024-07-24",
    status: "Completed",
  },
];

export const savingsAccounts: SavingsAccount[] = [
  {
    id: "sav1",
    memberId: "1",
    memberName: "Anathalie Mukamana",
    accountNumber: "SAV001",
    type: "Compulsory",
    balance: 52000,
    openDate: "2023-01-15",
  },
  {
    id: "sav2",
    memberId: "2",
    memberName: "Jean Bosco Nsengiyumva",
    accountNumber: "SAV002",
    type: "Voluntary",
    balance: 78000,
    openDate: "2023-02-20",
  },
  {
    id: "sav3",
    memberId: "3",
    memberName: "Clementine Uwera",
    accountNumber: "SAV003",
    type: "Compulsory",
    balance: 21010,
    openDate: "2023-03-10",
  },
];

export const loans: Loan[] = [
  {
    id: "loan1",
    memberId: "1",
    memberName: "Anathalie Mukamana",
    loanId: "LN001",
    principal: 200000,
    balance: 150000,
    interestRate: 10,
    issueDate: "2024-03-01",
    dueDate: "2024-08-01",
    status: "Active",
  },
  {
    id: "loan2",
    memberId: "3",
    memberName: "Clementine Uwera",
    loanId: "LN002",
    principal: 50000,
    balance: 50000,
    interestRate: 12,
    issueDate: "2024-06-15",
    dueDate: "2024-09-15",
    status: "Active",
  },
  {
    id: "loan3",
    memberId: "4",
    memberName: "Emmanuel Habimana",
    loanId: "LN003",
    principal: 300000,
    balance: 250000,
    interestRate: 8,
    issueDate: "2024-01-20",
    dueDate: "2024-07-20",
    status: "Overdue",
  },
  {
    id: "loan4",
    memberId: "5",
    memberName: "Solange Irakoze",
    loanId: "LN004",
    principal: 100000,
    balance: 0,
    interestRate: 10,
    issueDate: "2023-09-01",
    dueDate: "2024-03-01",
    status: "Paid",
  },
];

export const income: CashbookEntry[] = [
    { id: 'inc1', date: '2024-07-01', description: 'Loan Interest - Anathalie Mukamana', category: 'Loan Interest', amount: 1500 },
    { id: 'inc2', date: '2024-07-05', description: 'Late Payment Fees', category: 'Fees', amount: 5000 },
    { id: 'inc3', date: '2024-07-10', description: 'Group Contribution', category: 'Contributions', amount: 100000 },
];

export const expenses: CashbookEntry[] = [
    { id: 'exp1', date: '2024-07-02', description: 'Office Stationery', category: 'Office Supplies', amount: 7600 },
    { id: 'exp2', date: '2024-07-15', description: 'Bank Charges', category: 'Bank Fees', amount: 2500 },
    { id: 'exp3', date: '2024-07-20', description: 'Software Subscription', category: 'IT', amount: 10000 },
];

export const chartData = [
  { month: "Jan", savings: 40000, loans: 24000 },
  { month: "Feb", savings: 30000, loans: 13980 },
  { month: "Mar", savings: 20000, loans: 98000 },
  { month: "Apr", savings: 27800, loans: 39080 },
  { month: "May", savings: 18900, loans: 48000 },
  { month: "Jun", savings: 23900, loans: 38000 },
  { month: "Jul", savings: 34900, loans: 43000 },
];

export const investments: Investment[] = [
  { id: 'inv1', name: 'Gahaya Links', type: 'Agribusiness', amountInvested: 500000, currentValue: 550000, purchaseDate: '2023-01-20', returnOnInvestment: 10 },
  { id: 'inv2', name: 'Vision City', type: 'Real Estate', amountInvested: 2000000, currentValue: 2400000, purchaseDate: '2022-11-10', returnOnInvestment: 20 },
  { id: 'inv3', name: 'GoKigali', type: 'Stock', amountInvested: 300000, currentValue: 315000, purchaseDate: '2023-05-15', returnOnInvestment: 5 },
  { id: 'inv4', name: 'Government Treasury Bond', type: 'Bond', amountInvested: 1000000, currentValue: 1080000, purchaseDate: '2023-03-01', returnOnInvestment: 8 },
];

export const auditLogs: AuditLog[] = [
  { id: 'log1', timestamp: '2024-07-29 10:00:15', user: { name: 'ZIGAMA Julius', avatarId: 'admin_avatar' }, action: 'User Login', details: 'Admin user logged in successfully.' },
  { id: 'log2', timestamp: '2024-07-29 09:45:30', user: { name: 'Marie Claire', avatarId: 'avatar2' }, action: 'Loan Approval', details: 'Approved loan LN002 for Clementine Uwera.' },
  { id: 'log3', timestamp: '2024-07-28 14:20:05', user: { name: 'Thierry Mugisha', avatarId: 'avatar3' }, action: 'New Deposit', details: 'Recorded new deposit of RWF 5,000 for Anathalie Mukamana.' },
  { id: 'log4', timestamp: '2024-07-28 11:10:00', user: { name: 'ZIGAMA Julius', avatarId: 'admin_avatar' }, action: 'Update System Settings', details: 'Changed default interest rate from 10% to 9.5%.' },
  { id: 'log5', timestamp: '2024-07-27 16:05:45', user: { name: 'Aline Umutesi', avatarId: 'avatar4' }, action: 'Report Generation', details: 'Generated Loan Portfolio report for Q2 2024.' },
];
