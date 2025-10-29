"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { initializeDatabase, handleDatabaseError } from "./database";
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

const sql = neon(process.env.DATABASE_URL!);

// Initialize database on first use
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// Members
export async function getMembers(): Promise<Member[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, name, first_name as "firstName", last_name as "lastName", 
        phone_number as "phoneNumber", savings_group as "savingsGroup",
        member_role as "memberRole", member_id as "memberId", 
        join_date as "joinDate", savings_balance as "savingsBalance",
        loan_balance as "loanBalance", status, avatar_id as "avatarId"
      FROM members 
      ORDER BY created_at DESC
    `;
    return result.map((row) => ({
      ...row,
      savingsBalance: Number(row.savingsBalance),
      loanBalance: Number(row.loanBalance),
      joinDate:
        row.joinDate instanceof Date
          ? row.joinDate.toISOString().split("T")[0]
          : row.joinDate,
    })) as Member[];
  } catch (error) {
    handleDatabaseError(error, "getMembers");
    return [];
  }
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, name, first_name as "firstName", last_name as "lastName", 
        phone_number as "phoneNumber", savings_group as "savingsGroup",
        member_role as "memberRole", member_id as "memberId", 
        join_date as "joinDate", savings_balance as "savingsBalance",
        loan_balance as "loanBalance", status, avatar_id as "avatarId"
      FROM members 
    if (!result || result.length === 0) return undefined;
    const row = result[0];
    return {
      ...row,
      savingsBalance: Number(row.savingsBalance),
      loanBalance: Number(row.loanBalance),
      joinDate:
        row.joinDate instanceof Date
          ? row.joinDate.toISOString().split("T")[0]
          : row.joinDate,
    } as Member;
  } catch (error) {
    handleDatabaseError(error, "getMemberById");
    return undefined;
  }
}

export async function addMember(member: Omit<Member, "id">): Promise<Member> {
  try {
    await ensureInitialized();
    const newId = `MEM${Date.now()}`;

    await sql`
      INSERT INTO members (
        id, name, first_name, last_name, phone_number, savings_group,
        member_role, member_id, join_date, savings_balance, loan_balance,
        status, avatar_id
      ) VALUES (
        ${newId}, ${member.name}, ${member.firstName}, ${member.lastName},
        ${member.phoneNumber}, ${member.savingsGroup}, ${member.memberRole},
        ${member.memberId}, ${member.joinDate}, ${member.savingsBalance || 0},
        ${member.loanBalance || 0}, ${member.status}, ${member.avatarId}
      )
    `;

    revalidatePath("/members");
    return { ...member, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addMember");
    throw error;
  }
}

export async function updateMember(
  id: string,
  updates: Partial<Omit<Member, "id">>
): Promise<Member> {
  try {
    await ensureInitialized();

    // Build update sets dynamically
    const updateSets: string[] = [];

    if (updates.name) {
      updateSets.push(`name = '${updates.name.replace(/'/g, "''")}'`);
    }
    if (updates.firstName) {
      updateSets.push(
        `first_name = '${updates.firstName.replace(/'/g, "''")}'`
      );
    }
    if (updates.lastName) {
      updateSets.push(`last_name = '${updates.lastName.replace(/'/g, "''")}'`);
    }
    if (updates.phoneNumber) {
      updateSets.push(
        `phone_number = '${updates.phoneNumber.replace(/'/g, "''")}'`
      );
    }
    if (updates.savingsGroup) {
      updateSets.push(
        `savings_group = '${updates.savingsGroup.replace(/'/g, "''")}'`
      );
    }
    if (updates.memberRole) {
      updateSets.push(
        `member_role = '${updates.memberRole.replace(/'/g, "''")}'`
      );
    }
    if (updates.status) {
      updateSets.push(`status = '${updates.status.replace(/'/g, "''")}'`);
    }
    if (updates.savingsBalance !== undefined) {
      updateSets.push(`savings_balance = ${updates.savingsBalance}`);
    }
    if (updates.loanBalance !== undefined) {
      updateSets.push(`loan_balance = ${updates.loanBalance}`);
    }

    updateSets.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateSets.length === 1) {
      // Only updated_at, no actual changes
      const member = await getMemberById(id);
      if (!member) throw new Error("Member not found");
      return member;
    }

    const result = await sql`
      UPDATE members 
      SET ${sql.unsafe(updateSets.join(", "))}
      WHERE id = ${id}
      RETURNING 
        id, name, first_name as "firstName", last_name as "lastName", 
        phone_number as "phoneNumber", savings_group as "savingsGroup",
        member_role as "memberRole", member_id as "memberId", 
        join_date as "joinDate", savings_balance as "savingsBalance",
        loan_balance as "loanBalance", status, avatar_id as "avatarId"
    `;

    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    revalidatePath("/");

    return result[0] as Member;
  } catch (error) {
    handleDatabaseError(error, "updateMember");
    throw error;
  }
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, member_name, member_avatar_id as "memberAvatarId", 
        type, amount, date, status
      FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    return result.map((row) => ({
      id: row.id,
      member: { name: row.member_name, avatarId: row.memberAvatarId },
      type: row.type,
      amount: Number(row.amount),
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      status: row.status,
    })) as Transaction[];
  } catch (error) {
    handleDatabaseError(error, "getTransactions");
    return [];
  }
}

export async function addTransaction(
  transaction: Omit<Transaction, "id" | "status">
): Promise<Transaction> {
  try {
    await ensureInitialized();
    const newId = `TXN${Date.now()}`;

    await sql`
      INSERT INTO transactions (id, member_name, member_avatar_id, type, amount, date, status)
      VALUES (
        ${newId}, ${transaction.member.name}, ${transaction.member.avatarId},
        ${transaction.type}, ${transaction.amount}, ${transaction.date}, 'Completed'
      )
    `;

    revalidatePath("/");
    revalidatePath("/transactions");

    return { ...transaction, id: newId, status: "Completed" };
  } catch (error) {
    handleDatabaseError(error, "addTransaction");
    throw error;
  }
}

// Savings Accounts
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, member_id as "memberId", member_name as "memberName",
        account_number as "accountNumber", type, balance, open_date as "openDate"
      FROM savings_accounts 
      ORDER BY created_at DESC
    `;

    return result.map((row) => ({
      ...row,
      balance: Number(row.balance),
      openDate:
        row.openDate instanceof Date
          ? row.openDate.toISOString().split("T")[0]
          : row.openDate,
    })) as SavingsAccount[];
  } catch (error) {
    handleDatabaseError(error, "getSavingsAccounts");
    return [];
  }
}

export async function updateSavingsAccount(
  memberId: string,
  amount: number
): Promise<SavingsAccount> {
  try {
    await ensureInitialized();

    // Get member details
    const member = await getMemberById(memberId);
    if (!member) throw new Error("Member not found");

    // Check existing accounts for this member
    const existingAccounts = await sql`
      SELECT * FROM savings_accounts WHERE member_id = ${memberId} ORDER BY account_number ASC
    `;

    if (existingAccounts.length === 0) {
      // Create first account for this member
      const newId = `SAV${Date.now()}`;
      const accountNumber = `${member.memberId}01`; // First account: MemberID + 01

      await sql`
        INSERT INTO savings_accounts (id, member_id, member_name, account_number, type, balance, open_date)
        VALUES (${newId}, ${memberId}, ${member.name}, ${accountNumber}, 'Voluntary', ${amount}, CURRENT_DATE)
      `;

      revalidatePath("/savings");
      return {
        id: newId,
        memberId,
        memberName: member.name,
        accountNumber,
        type: "Voluntary",
        balance: amount,
        openDate: new Date().toISOString().split("T")[0],
      };
    } else {
      // For now, update the first account (existing behavior)
      // TODO: In future, we might want to specify which account to update
      const accountToUpdate = existingAccounts[0];
      const newBalance = Number(accountToUpdate.balance) + amount;

      await sql`
        UPDATE savings_accounts
        SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${accountToUpdate.id}
      `;

      revalidatePath("/savings");
      return {
        ...accountToUpdate,
        balance: newBalance,
      } as SavingsAccount;
    }
  } catch (error) {
    handleDatabaseError(error, "updateSavingsAccount");
    throw error;
  }
}

// Loans
export async function getLoans(): Promise<Loan[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, member_id as "memberId", member_name as "memberName",
        loan_id as "loanId", principal, balance, interest_rate as "interestRate",
        issue_date as "issueDate", due_date as "dueDate", status,
        loan_term as "loanTerm", loan_purpose as "loanPurpose"
      FROM loans 
      ORDER BY created_at DESC
    `;

    return result.map((row) => ({
      ...row,
      principal: Number(row.principal),
      balance: Number(row.balance),
      interestRate: Number(row.interestRate),
      loanTerm: Number(row.loanTerm),
      issueDate:
        row.issueDate instanceof Date
          ? row.issueDate.toISOString().split("T")[0]
          : row.issueDate,
      dueDate:
        row.dueDate instanceof Date
          ? row.dueDate.toISOString().split("T")[0]
          : row.dueDate,
    })) as Loan[];
  } catch (error) {
    handleDatabaseError(error, "getLoans");
    return [];
  }
}

export async function addLoan(loan: Omit<Loan, "id">): Promise<Loan> {
  try {
    await ensureInitialized();
    const newId = `LN${Date.now()}`;

    await sql`
      INSERT INTO loans (
        id, member_id, member_name, loan_id, principal, balance, interest_rate,
        issue_date, due_date, status, loan_term, loan_purpose
      ) VALUES (
        ${newId}, ${loan.memberId}, ${loan.memberName}, ${loan.loanId},
        ${loan.principal}, ${loan.balance}, ${loan.interestRate},
        ${loan.issueDate}, ${loan.dueDate}, ${loan.status},
        ${loan.loanTerm}, ${loan.loanPurpose}
      )
    `;

    revalidatePath("/loans");
    return { ...loan, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addLoan");
    throw error;
  }
}

// Cashbook
export async function getCashbook() {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT id, type, date, description, category, amount
      FROM cashbook_entries 
      ORDER BY date DESC
    `;

    const income = result
      .filter((row) => row.type === "income")
      .map((row) => ({
        id: row.id,
        date:
          row.date instanceof Date
            ? row.date.toISOString().split("T")[0]
            : row.date,
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
      }));

    const expenses = result
      .filter((row) => row.type === "expense")
      .map((row) => ({
        id: row.id,
        date:
          row.date instanceof Date
            ? row.date.toISOString().split("T")[0]
            : row.date,
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
      }));

    return { income, expenses };
  } catch (error) {
    handleDatabaseError(error, "getCashbook");
    return { income: [], expenses: [] };
  }
}

export async function addCashbookEntry(
  type: "income" | "expenses",
  entry: Omit<CashbookEntry, "id">
): Promise<CashbookEntry> {
  try {
    await ensureInitialized();
    const newId = `${type.slice(0, 3)}${Date.now()}`;
    const dbType = type === "expenses" ? "expense" : "income";

    await sql`
      INSERT INTO cashbook_entries (id, type, date, description, category, amount)
      VALUES (${newId}, ${dbType}, ${entry.date}, ${entry.description}, ${entry.category}, ${entry.amount})
    `;

    revalidatePath("/accounting");
    return { ...entry, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addCashbookEntry");
    throw error;
  }
}

// Additional functions for other data types would follow the same pattern...
// For brevity, I'll add the key ones

export async function getUsers(): Promise<User[]> {
  try {
    await ensureInitialized();
    const result =
      await sql`SELECT id, name, email, role FROM users ORDER BY created_at DESC`;
    return result as User[];
  } catch (error) {
    handleDatabaseError(error, "getUsers");
    return [];
  }
}

export async function addUser(user: Omit<User, "id">): Promise<User> {
  try {
    await ensureInitialized();
    const result = await sql`
      INSERT INTO users (name, email, role)
      VALUES (${user.name}, ${user.email}, ${user.role})
      RETURNING *
    `;

    revalidatePath("/admin");
    return result[0] as User;
  } catch (error) {
    handleDatabaseError(error, "addUser");
    throw error;
  }
}

// Placeholder functions for other operations (to maintain API compatibility)
export async function getTransactionsByMemberId(
  memberId: string
): Promise<Transaction[]> {
  const transactions = await getTransactions();
  const member = await getMemberById(memberId);
  if (!member) return [];
  return transactions.filter((tx) => tx.member.name === member.name);
}

export async function getLoanById(id: string): Promise<Loan | undefined> {
  const loans = await getLoans();
  return loans.find((l) => l.id === id);
}

export async function updateLoanInDb(
  id: string,
  updates: Partial<Omit<Loan, "id">>
): Promise<Loan> {
  // Implementation would be similar to updateMember
  throw new Error("updateLoanInDb not implemented yet");
}

export async function updateCashbookEntry(
  type: "income" | "expenses",
  id: string,
  updates: Partial<Omit<CashbookEntry, "id">>
) {
  throw new Error("updateCashbookEntry not implemented yet");
}

export async function deleteCashbookEntry(
  type: "income" | "expenses",
  id: string
) {
  throw new Error("deleteCashbookEntry not implemented yet");
}

export async function getInvestments(): Promise<Investment[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, name, type, amount_invested as "amountInvested", 
        current_value as "currentValue", purchase_date as "purchaseDate",
        return_on_investment as "returnOnInvestment"
      FROM investments 
      ORDER BY created_at DESC
    `;
    return result.map((row) => ({
      ...row,
      amountInvested: Number(row.amountInvested),
      currentValue: Number(row.currentValue),
      returnOnInvestment: Number(row.returnOnInvestment),
      purchaseDate:
        row.purchaseDate instanceof Date
          ? row.purchaseDate.toISOString().split("T")[0]
          : row.purchaseDate,
    })) as Investment[];
  } catch (error) {
    handleDatabaseError(error, "getInvestments");
    return [];
  }
}

export async function addInvestment(
  investment: Omit<Investment, "id">
): Promise<Investment> {
  try {
    await ensureInitialized();
    const newId = `INV${Date.now()}`;

    await sql`
      INSERT INTO investments (id, name, type, amount_invested, current_value, purchase_date, return_on_investment)
      VALUES (${newId}, ${investment.name}, ${investment.type}, ${investment.amountInvested}, 
              ${investment.currentValue}, ${investment.purchaseDate}, ${investment.returnOnInvestment})
    `;

    revalidatePath("/investments");
    return { ...investment, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addInvestment");
    throw error;
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT id, timestamp, user_name, user_avatar_id, action, details
      FROM audit_logs 
      ORDER BY timestamp DESC
    `;
    return result.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      user: { name: row.user_name, avatarId: row.user_avatar_id },
      action: row.action,
      details: row.details,
    })) as AuditLog[];
  } catch (error) {
    handleDatabaseError(error, "getAuditLogs");
    return [];
  }
}

// Stub functions for compatibility
export async function updateUser(
  id: number,
  updates: Partial<Omit<User, "id">>
): Promise<User> {
  throw new Error("updateUser not implemented yet");
}

export async function saveSettings(filename: string, data: any) {
  throw new Error("saveSettings not implemented yet");
}

export async function getReports(): Promise<Report[]> {
  return [];
}

export async function addReport(report: Omit<Report, "id">): Promise<Report> {
  throw new Error("addReport not implemented yet");
}

export async function getPayments(): Promise<Payment[]> {
  return [];
}

export async function addPayment(
  payment: Omit<Payment, "id">
): Promise<Payment> {
  throw new Error("addPayment not implemented yet");
}

export async function updatePayment(
  id: string,
  updates: Partial<Omit<Payment, "id">>
): Promise<Payment> {
  throw new Error("updatePayment not implemented yet");
}

export async function getAccounting(): Promise<AccountingData> {
  return { accounts: [], journalEntries: [] };
}

export async function updateAccounting(data: AccountingData): Promise<void> {
  throw new Error("updateAccounting not implemented yet");
}

export async function addJournalEntry(
  entry: Omit<JournalEntry, "id">
): Promise<JournalEntry> {
  throw new Error("addJournalEntry not implemented yet");
}

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
): Promise<void> {
  throw new Error("updateAccountBalance not implemented yet");
}
