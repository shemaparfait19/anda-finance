'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Member, Transaction, SavingsAccount, Loan, CashbookEntry, Investment, AuditLog, User } from './types';

const dataPath = path.join(process.cwd(), 'src', 'data');

async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataPath, filename);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If the file doesn't exist, return an empty array or a default structure.
      // This is a safe fallback for initial runs.
      return [] as T;
    }
    throw error;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataPath, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Members
export async function getMembers(): Promise<Member[]> {
  return readData<Member[]>('members.json');
}

export async function addMember(member: Omit<Member, 'id'>): Promise<Member> {
  const members = await getMembers();
  const newMember: Member = { ...member, id: `MEM${Date.now()}` };
  members.push(newMember);
  await writeData('members.json', members);
  return newMember;
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  return readData<Transaction[]>('transactions.json');
}

// Savings Accounts
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
    return readData<SavingsAccount[]>('savings.json');
}

// Loans
export async function getLoans(): Promise<Loan[]> {
    return readData<Loan[]>('loans.json');
}

// Cashbook
export async function getCashbook() {
    return readData<{ income: CashbookEntry[], expenses: CashbookEntry[] }>('cashbook.json');
}

// Investments
export async function getInvestments(): Promise<Investment[]> {
    return readData<Investment[]>('investments.json');
}

// Audit Logs
export async function getAuditLogs(): Promise<AuditLog[]> {
    return readData<AuditLog[]>('audit.json');
}

// Users
export async function getUsers(): Promise<User[]> {
    return readData<User[]>('users.json');
}
