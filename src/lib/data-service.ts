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

// In-memory storage for production environments
const inMemoryStorage: Record<string, any> = {};
let isReadOnlyEnvironment = false;

// Check if we're in a read-only environment
async function checkEnvironment() {
  try {
    const testPath = path.join(dataPath, ".test");
    await fs.writeFile(testPath, "test", "utf-8");
    await fs.unlink(testPath);
    isReadOnlyEnvironment = false;
    console.log("🔧 Development environment - using file system storage");
  } catch (error) {
    isReadOnlyEnvironment = true;
    console.log("🚀 Production environment - using in-memory storage");
    // Initialize with default data if needed
    await initializeInMemoryStorage();
  }
}

// Initialize in-memory storage with data from files (for production)
async function initializeInMemoryStorage() {
  const dataFiles = [
    "members.json",
    "transactions.json",
    "savings.json",
    "loans.json",
    "cashbook.json",
    "investments.json",
    "audit.json",
    "users.json",
    "reports.json",
    "payments.json",
    "accounting.json",
  ];

  for (const filename of dataFiles) {
    try {
      // Try to read existing data from bundled files
      const filePath = path.join(dataPath, filename);
      const fileContent = await fs.readFile(filePath, "utf-8");
      inMemoryStorage[filename] = JSON.parse(fileContent);
      console.log(`📦 Loaded ${filename} into memory`);
    } catch (error) {
      // If file doesn't exist, use default empty data
      const defaultValue =
        filename === "cashbook.json"
          ? { income: [], expenses: [] }
          : filename === "accounting.json"
          ? { accounts: [], journalEntries: [] }
          : [];

      inMemoryStorage[filename] = defaultValue;
      console.log(`🔄 Initialized ${filename} with empty data`);
    }
  }
}

async function readData<T>(filename: string): Promise<T> {
  // Check environment on first read
  if (isReadOnlyEnvironment === false && !inMemoryStorage._environmentChecked) {
    await checkEnvironment();
    inMemoryStorage._environmentChecked = true;
  }

  // If in read-only environment and data exists in memory, use it
  if (isReadOnlyEnvironment && inMemoryStorage[filename]) {
    return inMemoryStorage[filename];
  }

  const filePath = path.join(dataPath, filename);
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // Store in memory for future reads in read-only environments
    if (isReadOnlyEnvironment) {
      inMemoryStorage[filename] = data;
    }

    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // This is a safe fallback for initial runs.
      const fallbackData =
        filename === "cashbook.json"
          ? ({ income: [], expenses: [] } as T)
          : ([] as T);

      // Store fallback in memory for read-only environments
      if (isReadOnlyEnvironment) {
        inMemoryStorage[filename] = fallbackData;
      }

      return fallbackData;
    }
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  // Check environment if not already done
  if (!inMemoryStorage._environmentChecked) {
    await checkEnvironment();
    inMemoryStorage._environmentChecked = true;
  }

  if (isReadOnlyEnvironment) {
    // Store in memory for read-only environments
    inMemoryStorage[filename] = data;
    console.log(`💾 Saved ${filename} to memory (read-only environment)`);
    return;
  }

  // Write to file system in development
  const filePath = path.join(dataPath, filename);
  try {
    await fs.mkdir(dataPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Saved ${filename} to file system`);
  } catch (error) {
    // Fallback to in-memory if file write fails
    console.warn(`⚠️ File write failed, using memory: ${error}`);
    inMemoryStorage[filename] = data;
    isReadOnlyEnvironment = true;
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

export async function addMember(member: Omit<Member, "id">): Promise<Member> {
  const members = await getMembers();
  const newMember: Member = { ...member, id: `MEM${Date.now()}` };
  members.push(newMember);
  await writeData("members.json", members);
  revalidatePath("/members");
  return newMember;
}

export async function updateMember(
  id: string,
  updates: Partial<Omit<Member, "id">>
): Promise<Member> {
  const members = await getMembers();
  const memberIndex = members.findIndex((m) => m.id === id);
  if (memberIndex === -1) throw new Error("Member not found");

  const updatedMember = { ...members[memberIndex], ...updates };
  members[memberIndex] = updatedMember;
  await writeData("members.json", members);
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  revalidatePath("/"); // For dashboard stats
  return updatedMember;
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
