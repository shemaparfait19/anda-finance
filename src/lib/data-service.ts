"use server";

import fs from "fs/promises";
import path from "path";
import type {
  Member,
  Transaction,
  SavingsAccount,
  Loan,
  CashbookEntry,
  Investment,
  AuditLog,
  User,
  Report,
  Payment,
  AccountingData,
  JournalEntry,
} from "./types";
import { revalidatePath } from "next/cache";

const dataPath = path.join(process.cwd(), "src", "data");

async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataPath, filename);
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // This is a safe fallback for initial runs.
      if (filename === "cashbook.json")
        return { income: [], expenses: [] } as T;
      return [] as T;
    }
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
}

async function writeData<T>(filename: string, data: T): Promise<boolean> {
  const filePath = path.join(dataPath, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Successfully saved data to ${filename}`);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EROFS" || err.code === "EACCES") {
      // Read-only file system (production environment)
      console.warn(
        `⚠️  Cannot write to ${filename} in read-only environment. Data changes will not persist.`
      );
      console.warn(
        "💡 In production, consider using a database or external storage service."
      );
      // In a real application, you would save to a database or external storage here
      return false;
    }
    console.error(`❌ Error writing to ${filename}:`, err.message);
    throw error;
  }
}

// Members
export async function getMembers(): Promise<Member[]> {
  return readData<Member[]>("members.json");
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  const members = await getMembers();
  return members.find((m) => m.id === id);
}

export async function addMember(
  member: Omit<Member, "id">
): Promise<Member & { persisted?: boolean }> {
  const members = await getMembers();
  const newMember: Member = { ...member, id: `MEM${Date.now()}` };
  members.push(newMember);
  const persisted = await writeData("members.json", members);
  revalidatePath("/members");
  return { ...newMember, persisted };
}

export async function updateMember(
  id: string,
  updates: Partial<Omit<Member, "id">>
): Promise<Member & { persisted?: boolean }> {
  const members = await getMembers();
  const memberIndex = members.findIndex((m) => m.id === id);
  if (memberIndex === -1) throw new Error("Member not found");

  const updatedMember = { ...members[memberIndex], ...updates };
  members[memberIndex] = updatedMember;
  const persisted = await writeData("members.json", members);
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  revalidatePath("/"); // For dashboard stats
  return { ...updatedMember, persisted };
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  return readData<Transaction[]>("transactions.json");
}

export async function getTransactionsByMemberId(
  memberId: string
): Promise<Transaction[]> {
  const allTransactions = await getTransactions();
  const member = await getMemberById(memberId);
  if (!member) return [];
  return allTransactions.filter((tx) => tx.member.name === member.name);
}

export async function addTransaction(
  transaction: Omit<Transaction, "id" | "status">
): Promise<Transaction> {
  const transactions = await getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: `TXN${Date.now()}`,
    status: "Completed",
  };
  transactions.unshift(newTransaction); // Add to the beginning
  await writeData("transactions.json", transactions.slice(0, 50)); // Keep the list size manageable
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/savings"); // For statement dialog
  return newTransaction;
}

// Savings Accounts
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  return readData<SavingsAccount[]>("savings.json");
}

export async function updateSavingsAccount(
  memberId: string,
  amount: number
): Promise<SavingsAccount> {
  const accounts = await getSavingsAccounts();
  const accountIndex = accounts.findIndex((a) => a.memberId === memberId);

  if (accountIndex === -1) {
    // If no account, create one. This is a simple approach for the demo.
    const members = await getMembers();
    const member = members.find((m) => m.id === memberId);
    if (!member)
      throw new Error("Member not found for creating savings account");

    const newAccount: SavingsAccount = {
      id: `SAV${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      accountNumber: `SAV${member.memberId}`,
      type: "Voluntary", // Default to voluntary
      balance: amount,
      openDate: new Date().toISOString().split("T")[0],
    };
    accounts.push(newAccount);
    await writeData("savings.json", accounts);
    revalidatePath("/savings");
    return newAccount;
  } else {
    const updatedAccount = {
      ...accounts[accountIndex],
      balance: accounts[accountIndex].balance + amount,
    };
    accounts[accountIndex] = updatedAccount;
    await writeData("savings.json", accounts);
    revalidatePath("/savings");
    return updatedAccount;
  }
}

// Loans
export async function getLoans(): Promise<Loan[]> {
  return readData<Loan[]>("loans.json");
}

export async function getLoanById(id: string): Promise<Loan | undefined> {
  const loans = await getLoans();
  return loans.find((l) => l.id === id);
}

export async function addLoan(loan: Omit<Loan, "id">): Promise<Loan> {
  const loans = await getLoans();
  const newLoan: Loan = { ...loan, id: `LN${Date.now()}` };
  loans.push(newLoan);
  await writeData("loans.json", loans);
  revalidatePath("/loans");
  return newLoan;
}

export async function updateLoanInDb(
  id: string,
  updates: Partial<Omit<Loan, "id">>
): Promise<Loan> {
  const loans = await getLoans();
  const loanIndex = loans.findIndex((l) => l.id === id);
  if (loanIndex === -1) throw new Error("Loan not found");

  const updatedLoan = { ...loans[loanIndex], ...updates };
  loans[loanIndex] = updatedLoan;
  await writeData("loans.json", loans);
  revalidatePath("/loans");
  return updatedLoan;
}

// Cashbook
export async function getCashbook() {
  return readData<{ income: CashbookEntry[]; expenses: CashbookEntry[] }>(
    "cashbook.json"
  );
}

export async function addCashbookEntry(
  type: "income" | "expenses",
  entry: Omit<CashbookEntry, "id">
): Promise<CashbookEntry> {
  const cashbook = await getCashbook();
  const newEntry = { ...entry, id: `${type.slice(0, 3)}${Date.now()}` };
  cashbook[type].push(newEntry);
  await writeData("cashbook.json", cashbook);
  revalidatePath("/accounting");
  return newEntry;
}

export async function updateCashbookEntry(
  type: "income" | "expenses",
  id: string,
  updates: Partial<Omit<CashbookEntry, "id">>
) {
  const cashbook = await getCashbook();
  const entryIndex = cashbook[type].findIndex((e) => e.id === id);
  if (entryIndex === -1) throw new Error("Entry not found");

  const updatedEntry = { ...cashbook[type][entryIndex], ...updates };
  cashbook[type][entryIndex] = updatedEntry;
  await writeData("cashbook.json", cashbook);
  revalidatePath("/accounting");
  return updatedEntry;
}

export async function deleteCashbookEntry(
  type: "income" | "expenses",
  id: string
) {
  const cashbook = await getCashbook();
  cashbook[type] = cashbook[type].filter((e) => e.id !== id);
  await writeData("cashbook.json", cashbook);
  revalidatePath("/accounting");
}

// Investments
export async function getInvestments(): Promise<Investment[]> {
  return readData<Investment[]>("investments.json");
}

export async function addInvestment(
  investment: Omit<Investment, "id">
): Promise<Investment> {
  const investments = await getInvestments();
  const newInvestment: Investment = { ...investment, id: `INV${Date.now()}` };
  investments.push(newInvestment);
  await writeData("investments.json", investments);
  revalidatePath("/investments");
  return newInvestment;
}

// Audit Logs
export async function getAuditLogs(): Promise<AuditLog[]> {
  return readData<AuditLog[]>("audit.json");
}

// Users
export async function getUsers(): Promise<User[]> {
  return readData<User[]>("users.json");
}

export async function addUser(user: Omit<User, "id">): Promise<User> {
  const users = await getUsers();
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser: User = { ...user, id: newId };
  users.push(newUser);
  await writeData("users.json", users);
  revalidatePath("/admin");
  return newUser;
}

export async function updateUser(
  id: number,
  updates: Partial<Omit<User, "id">>
): Promise<User> {
  const users = await getUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) throw new Error("User not found");

  const updatedUser = { ...users[userIndex], ...updates };
  users[userIndex] = updatedUser;
  await writeData("users.json", users);
  revalidatePath("/admin");
  return updatedUser;
}

// Generic settings writer
export async function saveSettings(filename: string, data: any) {
  // Note: In a real app, this would be much more secure and structured.
  // For this demo, we just overwrite the file.
  await writeData(filename, data);
  // Revalidate paths that might use this data
  if (filename.includes("system")) revalidatePath("/admin");
  if (filename.includes("payment")) revalidatePath("/payments");
}

// Reports
export async function getReports(): Promise<Report[]> {
  return readData<Report[]>("reports.json");
}

export async function addReport(report: Omit<Report, "id">): Promise<Report> {
  const reports = await getReports();
  const newReport: Report = { ...report, id: `RPT${Date.now()}` };
  reports.push(newReport);
  await writeData("reports.json", reports);
  revalidatePath("/reports");
  return newReport;
}

// Payments
export async function getPayments(): Promise<Payment[]> {
  return readData<Payment[]>("payments.json");
}

export async function addPayment(
  payment: Omit<Payment, "id">
): Promise<Payment> {
  const payments = await getPayments();
  const newPayment: Payment = { ...payment, id: `PAY${Date.now()}` };
  payments.push(newPayment);
  await writeData("payments.json", payments);
  revalidatePath("/payments");
  return newPayment;
}

export async function updatePayment(
  id: string,
  updates: Partial<Omit<Payment, "id">>
): Promise<Payment> {
  const payments = await getPayments();
  const paymentIndex = payments.findIndex((p) => p.id === id);
  if (paymentIndex === -1) throw new Error("Payment not found");

  const updatedPayment = { ...payments[paymentIndex], ...updates };
  payments[paymentIndex] = updatedPayment;
  await writeData("payments.json", payments);
  revalidatePath("/payments");
  return updatedPayment;
}

// Accounting
export async function getAccounting(): Promise<AccountingData> {
  return readData<AccountingData>("accounting.json");
}

export async function updateAccounting(data: AccountingData): Promise<void> {
  await writeData("accounting.json", data);
  revalidatePath("/accounting");
}

export async function addJournalEntry(
  entry: Omit<JournalEntry, "id">
): Promise<JournalEntry> {
  const accounting = await getAccounting();
  const newEntry: JournalEntry = { ...entry, id: `JE${Date.now()}` };
  accounting.journalEntries = accounting.journalEntries || [];
  accounting.journalEntries.push(newEntry);
  await writeData("accounting.json", accounting);
  revalidatePath("/accounting");
  return newEntry;
}

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
): Promise<void> {
  const accounting = await getAccounting();
  const account = accounting.accounts.find((acc) => acc.id === accountId);
  if (account) {
    account.balance = newBalance;
    account.lastUpdated = new Date().toISOString().split("T")[0];
    await writeData("accounting.json", accounting);
    revalidatePath("/accounting");
  }
}
