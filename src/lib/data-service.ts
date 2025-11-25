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
        id, name, first_name as "firstName", middle_name as "middleName", last_name as "lastName", 
        phone_number as "phoneNumber", member_id as "memberId", 
        join_date as "joinDate", savings_balance as "savingsBalance",
        loan_balance as "loanBalance", status, avatar_id as "avatarId",
        date_of_birth as "dateOfBirth", gender, national_id as "nationalId", email, alternative_phone as "alternativePhone", 
        province, district, sector, cell, village, address,
        next_of_kin_name as "nextOfKinName", next_of_kin_phone as "nextOfKinPhone", next_of_kin_relationship as "nextOfKinRelationship",
        share_amount as "shareAmount", number_of_shares as "numberOfShares",
        monthly_contribution as "monthlyContribution", contribution_date as "contributionDate", collection_means as "collectionMeans", other_collection_means as "otherCollectionMeans", account_number as "accountNumber", deactivation_reason as "deactivationReason"
      FROM members 
      ORDER BY created_at DESC
    `;
    return result.map((row) => ({
      id: row.id,
      name: row.name,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
      phoneNumber: row.phoneNumber,
      memberId: row.memberId,
      joinDate: row.joinDate,
      savingsBalance: Number(row.savingsBalance),
      loanBalance: Number(row.loanBalance),
      status: row.status,
      avatarId: row.avatarId,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      nationalId: row.nationalId,
      email: row.email,
      alternativePhone: row.alternativePhone,
      province: row.province,
      district: row.district,
      sector: row.sector,
      cell: row.cell,
      village: row.village,
      address: row.address,
      nextOfKinName: row.nextOfKinName,
      nextOfKinPhone: row.nextOfKinPhone,
      nextOfKinRelationship: row.nextOfKinRelationship,
      shareAmount: row.shareAmount ? Number(row.shareAmount) : undefined,
      numberOfShares: row.numberOfShares ? Number(row.numberOfShares) : undefined,
      monthlyContribution: row.monthlyContribution ? Number(row.monthlyContribution) : undefined,
      contributionDate: row.contributionDate,
      collectionMeans: row.collectionMeans,
      otherCollectionMeans: row.otherCollectionMeans,
      accountNumber: row.accountNumber,
      deactivationReason: row.deactivationReason,
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
        id, name, first_name as "firstName", middle_name as "middleName", last_name as "lastName",
        phone_number as "phoneNumber", member_id as "memberId",
        join_date as "joinDate", savings_balance as "savingsBalance",
        loan_balance as "loanBalance", status, avatar_id as "avatarId",
        date_of_birth as "dateOfBirth", gender, national_id as "nationalId", email, alternative_phone as "alternativePhone",
        province, district, sector, cell, village, address,
        next_of_kin_name as "nextOfKinName", next_of_kin_phone as "nextOfKinPhone", next_of_kin_relationship as "nextOfKinRelationship",
        share_amount as "shareAmount", number_of_shares as "numberOfShares",
        monthly_contribution as "monthlyContribution", contribution_date as "contributionDate", collection_means as "collectionMeans", other_collection_means as "otherCollectionMeans", account_number as "accountNumber", deactivation_reason as "deactivationReason"
      FROM members
      WHERE id = ${id}
    `;
    if (!result || result.length === 0) return undefined;
    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
      phoneNumber: row.phoneNumber,
      memberId: row.memberId,
      joinDate: row.joinDate,
      savingsBalance: Number(row.savingsBalance),
      loanBalance: Number(row.loanBalance),
      status: row.status,
      avatarId: row.avatarId,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      nationalId: row.nationalId,
      email: row.email,
      alternativePhone: row.alternativePhone,
      province: row.province,
      district: row.district,
      sector: row.sector,
      cell: row.cell,
      village: row.village,
      address: row.address,
      nextOfKinName: row.nextOfKinName,
      nextOfKinPhone: row.nextOfKinPhone,
      nextOfKinRelationship: row.nextOfKinRelationship,
      shareAmount: row.shareAmount ? Number(row.shareAmount) : undefined,
      numberOfShares: row.numberOfShares ? Number(row.numberOfShares) : undefined,
      monthlyContribution: row.monthlyContribution ? Number(row.monthlyContribution) : undefined,
      contributionDate: row.contributionDate,
      collectionMeans: row.collectionMeans,
      otherCollectionMeans: row.otherCollectionMeans,
      accountNumber: row.accountNumber,
      deactivationReason: row.deactivationReason,
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
        id, name, first_name, middle_name, last_name, phone_number, member_id, join_date,
        savings_balance, loan_balance, status, avatar_id, 
        date_of_birth, gender, national_id, email, alternative_phone, 
        province, district, sector, cell, village, address,
        next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
        share_amount, number_of_shares,
        monthly_contribution, contribution_date, collection_means, other_collection_means, account_number
      ) VALUES (
        ${newId}, ${member.name}, ${member.firstName || null}, ${member.middleName || null}, ${member.lastName || null},
        ${member.phoneNumber || null}, ${member.memberId}, ${member.joinDate},
        ${member.savingsBalance || 0}, ${member.loanBalance || 0}, ${member.status},
        ${member.avatarId || null}, 
        ${member.dateOfBirth || null}, ${member.gender || null}, ${member.nationalId || null}, ${member.email || null}, ${member.alternativePhone || null},
        ${member.province || null}, ${member.district || null}, ${member.sector || null}, ${member.cell || null}, ${member.village || null}, ${member.address || null},
        ${member.nextOfKinName || null}, ${member.nextOfKinPhone || null}, ${member.nextOfKinRelationship || null},
        ${member.shareAmount || null}, ${member.numberOfShares || null},
        ${member.monthlyContribution || null}, ${member.contributionDate || null}, ${member.collectionMeans || null}, ${member.otherCollectionMeans || null}, ${member.accountNumber || null}
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

    if (updates.name !== undefined) {
      updateSets.push(`name = '${updates.name.replace(/'/g, "''")}'`);
    }
    if (updates.firstName !== undefined) {
      updateSets.push(
        `first_name = '${updates.firstName.replace(/'/g, "''")}'`
      );
    }
    if (updates.lastName !== undefined) {
      updateSets.push(`last_name = '${updates.lastName.replace(/'/g, "''")}'`);
    }
    if (updates.phoneNumber !== undefined) {
      updateSets.push(
        `phone_number = '${updates.phoneNumber.replace(/'/g, "''")}'`
      );
    }
    if (updates.status !== undefined) {
      updateSets.push(`status = '${updates.status.replace(/'/g, "''")}'`);
    }
    if (updates.deactivationReason !== undefined) {
      updateSets.push(`deactivation_reason = '${updates.deactivationReason.replace(/'/g, "''")}'`);
    }
    if (updates.savingsBalance !== undefined) {
      updateSets.push(`savings_balance = ${updates.savingsBalance}`);
    }
    if (updates.loanBalance !== undefined) {
      updateSets.push(`loan_balance = ${updates.loanBalance}`);
    }
    if (updates.avatarId !== undefined) {
      updateSets.push(`avatar_id = '${updates.avatarId.replace(/'/g, "''")}'`);
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
        phone_number as "phoneNumber", member_id as "memberId", 
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
        account_number as "accountNumber", type, balance, 
        account_name as "accountName", open_date as "openDate"
      FROM savings_accounts 
      ORDER BY created_at DESC
    `;

    return result.map((row) => ({
      ...row,
      memberId: row.memberId || undefined,
      memberName: row.memberName || undefined,
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
        VALUES (${newId}, ${memberId}, ${member.name}, ${accountNumber}, 'Compulsory', ${amount}, CURRENT_DATE)
      `;

      revalidatePath("/savings");
      return {
        id: newId,
        memberId,
        memberName: member.name,
        accountNumber,
        type: "Compulsory",
        balance: amount,
        openDate: new Date().toISOString().split("T")[0],
      };
    } else {
      // For now, update the first account (existing behavior)
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

export async function createSavingsAccount(
  memberId: string,
  type: "Voluntary" | "Internal",
  accountName: string
): Promise<SavingsAccount> {
  try {
    await ensureInitialized();

    // Get member details
    const member = await getMemberById(memberId);
    if (!member) throw new Error("Member not found");

    // Check existing accounts for this member to determine next account number
    const existingAccounts = await sql`
      SELECT account_number FROM savings_accounts 
      WHERE member_id = ${memberId} 
      ORDER BY account_number DESC
      LIMIT 1
    `;

    let nextAccountNumber;
    if (existingAccounts.length > 0) {
      // Extract the last 2 digits and increment
      const lastAccount = existingAccounts[0].account_number;
      // Assuming format MemberID + XX (e.g. BIF00101)
      // If memberId is BIF001, account is BIF00101. 
      // We need to be careful about parsing.
      // Let's assume the suffix is always 2 digits.
      const suffix = lastAccount.slice(-2);
      const prefix = lastAccount.slice(0, -2);
      
      if (prefix === member.memberId && !isNaN(Number(suffix))) {
         const nextNum = Number(suffix) + 1;
         nextAccountNumber = `${member.memberId}${nextNum.toString().padStart(2, '0')}`;
      } else {
         // Fallback if format doesn't match
         nextAccountNumber = `${member.memberId}${existingAccounts.length + 1}`;
      }
    } else {
      // First account (though usually Compulsory is first, created elsewhere)
      // If this is truly a new sub-account, maybe start at 02 if 01 is reserved for Compulsory?
      // But we don't know if Compulsory exists.
      // Let's check if ANY account exists, if not start 01.
      // Actually the query above checks for ANY savings account for this member.
      nextAccountNumber = `${member.memberId}01`;
    }

    const newId = `SAV${Date.now()}`;

    await sql`
      INSERT INTO savings_accounts (
        id, member_id, member_name, account_number, type, balance, account_name, open_date
      )
      VALUES (
        ${newId}, ${memberId}, ${member.name}, ${nextAccountNumber}, ${type}, 0, ${accountName}, CURRENT_DATE
      )
    `;

    revalidatePath("/savings");
    return {
      id: newId,
      memberId,
      memberName: member.name,
      accountNumber: nextAccountNumber,
      type,
      balance: 0,
      accountName,
      openDate: new Date().toISOString().split("T")[0],
    };
  } catch (error) {
    handleDatabaseError(error, "createSavingsAccount");
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

export async function getLoanById(id: string): Promise<Loan | undefined> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT 
        id, member_id as "memberId", member_name as "memberName",
        loan_id as "loanId", principal, balance, interest_rate as "interestRate",
        issue_date as "issueDate", due_date as "dueDate", status,
        loan_term as "loanTerm", loan_purpose as "loanPurpose"
      FROM loans 
      WHERE id = ${id}
    `;

    if (!result || result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      memberId: row.memberId,
      memberName: row.memberName,
      loanId: row.loanId,
      principal: Number(row.principal),
      balance: Number(row.balance),
      interestRate: Number(row.interestRate),
      loanTerm: Number(row.loanTerm),
      loanPurpose: row.loanPurpose,
      issueDate:
        row.issueDate instanceof Date
          ? row.issueDate.toISOString().split("T")[0]
          : row.issueDate,
      dueDate:
        row.dueDate instanceof Date
          ? row.dueDate.toISOString().split("T")[0]
          : row.dueDate,
      status: row.status,
    } as Loan;
  } catch (error) {
    handleDatabaseError(error, "getLoanById");
    return undefined;
  }
}

export async function updateLoanInDb(
  id: string,
  updates: Partial<Omit<Loan, "id">>
): Promise<Loan> {
  try {
    await ensureInitialized();

    const updateSets: string[] = [];

    if (updates.memberName !== undefined) {
      updateSets.push(
        `member_name = '${updates.memberName.replace(/'/g, "''")}'`
      );
    }
    if (updates.loanId !== undefined) {
      updateSets.push(`loan_id = '${updates.loanId.replace(/'/g, "''")}'`);
    }
    if (updates.principal !== undefined) {
      updateSets.push(`principal = ${updates.principal}`);
    }
    if (updates.balance !== undefined) {
      updateSets.push(`balance = ${updates.balance}`);
    }
    if (updates.interestRate !== undefined) {
      updateSets.push(`interest_rate = ${updates.interestRate}`);
    }
    if (updates.issueDate !== undefined) {
      updateSets.push(`issue_date = '${updates.issueDate}'`);
    }
    if (updates.dueDate !== undefined) {
      updateSets.push(`due_date = '${updates.dueDate}'`);
    }
    if (updates.status !== undefined) {
      updateSets.push(`status = '${updates.status.replace(/'/g, "''")}'`);
    }
    if (updates.loanTerm !== undefined) {
      updateSets.push(`loan_term = ${updates.loanTerm}`);
    }
    if (updates.loanPurpose !== undefined) {
      updateSets.push(
        `loan_purpose = '${updates.loanPurpose.replace(/'/g, "''")}'`
      );
    }

    updateSets.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateSets.length === 1) {
      const loan = await getLoanById(id);
      if (!loan) throw new Error("Loan not found");
      return loan;
    }

    const result = await sql`
      UPDATE loans 
      SET ${sql.unsafe(updateSets.join(", "))}
      WHERE id = ${id}
      RETURNING 
        id, member_id as "memberId", member_name as "memberName",
        loan_id as "loanId", principal, balance, interest_rate as "interestRate",
        issue_date as "issueDate", due_date as "dueDate", status,
        loan_term as "loanTerm", loan_purpose as "loanPurpose"
    `;

    revalidatePath("/loans");
    revalidatePath(`/loans/${id}`);

    const row = result[0];
    return {
      ...row,
      principal: Number(row.principal),
      balance: Number(row.balance),
      interestRate: Number(row.interestRate),
      loanTerm: Number(row.loanTerm),
    } as Loan;
  } catch (error) {
    handleDatabaseError(error, "updateLoanInDb");
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
    const newId = `${type.slice(0, 3).toUpperCase()}${Date.now()}`;
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

export async function updateCashbookEntry(
  type: "income" | "expenses",
  id: string,
  updates: Partial<Omit<CashbookEntry, "id">>
): Promise<CashbookEntry> {
  try {
    await ensureInitialized();

    const updateSets: string[] = [];

    if (updates.date !== undefined) {
      updateSets.push(`date = '${updates.date}'`);
    }
    if (updates.description !== undefined) {
      updateSets.push(
        `description = '${updates.description.replace(/'/g, "''")}'`
      );
    }
    if (updates.category !== undefined) {
      updateSets.push(`category = '${updates.category.replace(/'/g, "''")}'`);
    }
    if (updates.amount !== undefined) {
      updateSets.push(`amount = ${updates.amount}`);
    }

    updateSets.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateSets.length === 1) {
      throw new Error("No updates provided");
    }

    const result = await sql`
      UPDATE cashbook_entries 
      SET ${sql.unsafe(updateSets.join(", "))}
      WHERE id = ${id}
      RETURNING id, date, description, category, amount
    `;

    revalidatePath("/accounting");

    const row = result[0];
    return {
      id: row.id,
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      description: row.description,
      category: row.category,
      amount: Number(row.amount),
    } as CashbookEntry;
  } catch (error) {
    handleDatabaseError(error, "updateCashbookEntry");
    throw error;
  }
}

export async function deleteCashbookEntry(
  type: "income" | "expenses",
  id: string
): Promise<void> {
  try {
    await ensureInitialized();

    await sql`
      DELETE FROM cashbook_entries 
      WHERE id = ${id}
    `;

    revalidatePath("/accounting");
  } catch (error) {
    handleDatabaseError(error, "deleteCashbookEntry");
    throw error;
  }
}

// Investments
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

// Audit Logs
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    await ensureInitialized();
    const result = await sql`
      SELECT id, timestamp, user_name, user_avatar_id, action, details
      FROM audit_logs 
      ORDER BY timestamp DESC
      LIMIT 100
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

export async function addAuditLog(
  log: Omit<AuditLog, "id">
): Promise<AuditLog> {
  try {
    await ensureInitialized();
    const newId = `AUD${Date.now()}`;

    await sql`
      INSERT INTO audit_logs (id, timestamp, user_name, user_avatar_id, action, details)
      VALUES (${newId}, ${log.timestamp}, ${log.user.name}, ${log.user.avatarId}, ${log.action}, ${log.details})
    `;

    revalidatePath("/audit");
    return { ...log, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addAuditLog");
    throw error;
  }
}

// Users
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

export async function updateUser(
  id: number,
  updates: Partial<Omit<User, "id">>
): Promise<User> {
  try {
    await ensureInitialized();

    const updateSets: string[] = [];

    if (updates.name !== undefined) {
      updateSets.push(`name = '${updates.name.replace(/'/g, "''")}'`);
    }
    if (updates.email !== undefined) {
      updateSets.push(`email = '${updates.email.replace(/'/g, "''")}'`);
    }
    if (updates.role !== undefined) {
      updateSets.push(`role = '${updates.role.replace(/'/g, "''")}'`);
    }

    updateSets.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateSets.length === 1) {
      throw new Error("No updates provided");
    }

    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(updateSets.join(", "))}
      WHERE id = ${id}
      RETURNING *
    `;

    revalidatePath("/admin");
    return result[0] as User;
  } catch (error) {
    handleDatabaseError(error, "updateUser");
    throw error;
  }
}

// Helper functions
export async function getTransactionsByMemberId(
  memberId: string
): Promise<Transaction[]> {
  const transactions = await getTransactions();
  const member = await getMemberById(memberId);
  if (!member) return [];
  return transactions.filter((tx) => tx.member.name === member.name);
}

// Settings
export async function saveSettings(filename: string, data: any): Promise<void> {
  try {
    await ensureInitialized();
    // This would typically save to a settings table or file
    // For now, just a placeholder
    console.log(`Saving settings for ${filename}:`, data);
  } catch (error) {
    handleDatabaseError(error, "saveSettings");
    throw error;
  }
}

// Reports - Stub implementations
export async function getReports(): Promise<Report[]> {
  try {
    await ensureInitialized();
    // Implement reports table query when needed
    return [];
  } catch (error) {
    handleDatabaseError(error, "getReports");
    return [];
  }
}

export async function addReport(report: Omit<Report, "id">): Promise<Report> {
  try {
    await ensureInitialized();
    const newId = `RPT${Date.now()}`;
    // Implement reports table insert when needed
    return { ...report, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addReport");
    throw error;
  }
}

// Payments - Stub implementations
export async function getPayments(): Promise<Payment[]> {
  try {
    await ensureInitialized();
    // Implement payments table query when needed
    return [];
  } catch (error) {
    handleDatabaseError(error, "getPayments");
    return [];
  }
}

export async function addPayment(
  payment: Omit<Payment, "id">
): Promise<Payment> {
  try {
    await ensureInitialized();
    const newId = `PAY${Date.now()}`;
    // Implement payments table insert when needed
    return { ...payment, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addPayment");
    throw error;
  }
}

export async function updatePayment(
  id: string,
  updates: Partial<Omit<Payment, "id">>
): Promise<Payment> {
  try {
    await ensureInitialized();
    // Implement payments table update when needed
    throw new Error("updatePayment not fully implemented yet");
  } catch (error) {
    handleDatabaseError(error, "updatePayment");
    throw error;
  }
}

// Accounting - Stub implementations
export async function getAccounting(): Promise<AccountingData> {
  try {
    await ensureInitialized();
    // Implement accounting tables query when needed
    return { accounts: [], journalEntries: [] };
  } catch (error) {
    handleDatabaseError(error, "getAccounting");
    return { accounts: [], journalEntries: [] };
  }
}

export async function updateAccounting(data: AccountingData): Promise<void> {
  try {
    await ensureInitialized();
    // Implement accounting tables update when needed
    console.log("Updating accounting data:", data);
  } catch (error) {
    handleDatabaseError(error, "updateAccounting");
    throw error;
  }
}

export async function addJournalEntry(
  entry: Omit<JournalEntry, "id">
): Promise<JournalEntry> {
  try {
    await ensureInitialized();
    const newId = `JE${Date.now()}`;
    // Implement journal entries table insert when needed
    return { ...entry, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addJournalEntry");
    throw error;
  }
}

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
): Promise<void> {
  try {
    await ensureInitialized();
    // Implement account balance update when needed
    console.log(`Updating account ${accountId} balance to ${newBalance}`);
  } catch (error) {
    handleDatabaseError(error, "updateAccountBalance");
    throw error;
  }
}
