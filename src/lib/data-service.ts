"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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

// Returns the current session user's group_id.
// SUPER_ADMIN has null → SQL `= null` never matches → zero rows (correct).
async function getGroupId(): Promise<string | null> {
  try {
    const session = await auth();
    return (session?.user as any)?.groupId ?? null;
  } catch {
    return null;
  }
}

// Members
export async function getMembers(): Promise<Member[]> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
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
      WHERE group_id = ${groupId}
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
    const groupId = await getGroupId();
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
      WHERE (id = ${id} OR member_id = ${id}) AND group_id = ${groupId}
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
    const groupId = await getGroupId();
    const newId = `MEM${Date.now()}`;

    await sql`
      INSERT INTO members (
        id, name, first_name, middle_name, last_name, phone_number, member_id, join_date,
        savings_balance, loan_balance, status, avatar_id,
        date_of_birth, gender, national_id, email, alternative_phone,
        province, district, sector, cell, village, address,
        next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
        share_amount, number_of_shares,
        monthly_contribution, contribution_date, collection_means, other_collection_means, account_number,
        group_id
      ) VALUES (
        ${newId}, ${member.name}, ${member.firstName || null}, ${member.middleName || null}, ${member.lastName || null},
        ${member.phoneNumber || null}, ${member.memberId}, ${member.joinDate},
        ${member.savingsBalance || 0}, ${member.loanBalance || 0}, ${member.status},
        ${member.avatarId || null},
        ${member.dateOfBirth || null}, ${member.gender || null}, ${member.nationalId || null}, ${member.email || null}, ${member.alternativePhone || null},
        ${member.province || null}, ${member.district || null}, ${member.sector || null}, ${member.cell || null}, ${member.village || null}, ${member.address || null},
        ${member.nextOfKinName || null}, ${member.nextOfKinPhone || null}, ${member.nextOfKinRelationship || null},
        ${member.shareAmount || null}, ${member.numberOfShares || null},
        ${member.monthlyContribution || null}, ${member.contributionDate || null}, ${member.collectionMeans || null}, ${member.otherCollectionMeans || null}, ${member.accountNumber || null},
        ${groupId}
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
    const groupId = await getGroupId();

    const updateSets: string[] = [];

    const esc = (s: string) => s.replace(/'/g, "''");

    if (updates.name !== undefined) updateSets.push(`name = '${esc(updates.name)}'`);
    if (updates.firstName !== undefined) updateSets.push(`first_name = '${esc(updates.firstName)}'`);
    if (updates.lastName !== undefined) updateSets.push(`last_name = '${esc(updates.lastName)}'`);
    if ((updates as any).middleName !== undefined) updateSets.push(`middle_name = '${esc((updates as any).middleName ?? '')}'`);
    if (updates.phoneNumber !== undefined) updateSets.push(`phone_number = '${esc(updates.phoneNumber)}'`);
    if (updates.status !== undefined) updateSets.push(`status = '${esc(updates.status)}'`);
    if (updates.deactivationReason !== undefined) updateSets.push(`deactivation_reason = '${esc(updates.deactivationReason)}'`);
    if (updates.savingsBalance !== undefined) updateSets.push(`savings_balance = ${updates.savingsBalance}`);
    if (updates.loanBalance !== undefined) updateSets.push(`loan_balance = ${updates.loanBalance}`);
    if (updates.avatarId !== undefined) updateSets.push(`avatar_id = '${esc(updates.avatarId)}'`);
    // Profile fields (email can be empty string → NULL)
    if (updates.email !== undefined) updateSets.push(updates.email ? `email = '${esc(updates.email)}'` : `email = NULL`);
    if (updates.gender !== undefined) updateSets.push(updates.gender ? `gender = '${esc(updates.gender)}'` : `gender = NULL`);
    if (updates.nationalId !== undefined) updateSets.push(updates.nationalId ? `national_id = '${esc(updates.nationalId)}'` : `national_id = NULL`);
    if ((updates as any).dateOfBirth !== undefined) updateSets.push((updates as any).dateOfBirth ? `date_of_birth = '${esc((updates as any).dateOfBirth)}'` : `date_of_birth = NULL`);
    // Location
    if (updates.province !== undefined) updateSets.push(updates.province ? `province = '${esc(updates.province)}'` : `province = NULL`);
    if (updates.district !== undefined) updateSets.push(updates.district ? `district = '${esc(updates.district)}'` : `district = NULL`);
    if (updates.sector !== undefined) updateSets.push(updates.sector ? `sector = '${esc(updates.sector)}'` : `sector = NULL`);
    if (updates.cell !== undefined) updateSets.push(updates.cell ? `cell = '${esc(updates.cell)}'` : `cell = NULL`);
    if (updates.village !== undefined) updateSets.push(updates.village ? `village = '${esc(updates.village)}'` : `village = NULL`);
    if (updates.address !== undefined) updateSets.push(updates.address ? `address = '${esc(updates.address)}'` : `address = NULL`);
    // Next of kin
    if (updates.nextOfKinName !== undefined) updateSets.push(`next_of_kin_name = '${esc(updates.nextOfKinName)}'`);
    if (updates.nextOfKinPhone !== undefined) updateSets.push(`next_of_kin_phone = '${esc(updates.nextOfKinPhone)}'`);
    if (updates.nextOfKinRelationship !== undefined) updateSets.push(`next_of_kin_relationship = '${esc(updates.nextOfKinRelationship)}'`);
    // Shares / contribution
    if (updates.monthlyContribution !== undefined) updateSets.push(`monthly_contribution = ${updates.monthlyContribution}`);
    if (updates.numberOfShares !== undefined) updateSets.push(`number_of_shares = ${updates.numberOfShares}`);

    updateSets.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateSets.length === 1) {
      const member = await getMemberById(id);
      if (!member) throw new Error("Member not found");
      return member;
    }

    const result = await sql`
      UPDATE members
      SET ${sql.unsafe(updateSets.join(", "))}
      WHERE id = ${id} AND group_id = ${groupId}
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
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, member_name, member_avatar_id as "memberAvatarId",
        type, amount, date, status
      FROM transactions
      WHERE group_id = ${groupId}
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
  transaction: Omit<Transaction, "id" | "status">,
  accountNumber?: string,
  reason?: string
): Promise<Transaction> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const newId = `TXN${Date.now()}`;

    await sql`
      INSERT INTO transactions (id, member_name, member_avatar_id, type, amount, date, status, account_number, reason, group_id)
      VALUES (
        ${newId}, ${transaction.member.name}, ${transaction.member.avatarId},
        ${transaction.type}, ${transaction.amount}, ${transaction.date}, 'Completed',
        ${accountNumber ?? null}, ${reason ?? null}, ${groupId}
      )
    `;

    revalidatePath("/");
    revalidatePath("/transactions");

    return { ...transaction, id: newId, status: "Completed", reason };
  } catch (error) {
    handleDatabaseError(error, "addTransaction");
    throw error;
  }
}

export async function getTransactionsByAccountNumber(
  accountNumber: string
): Promise<Transaction[]> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      SELECT id, member_name, member_avatar_id as "memberAvatarId",
             type, amount, date, status, reason
      FROM transactions
      WHERE account_number = ${accountNumber} AND group_id = ${groupId}
      ORDER BY date ASC, created_at ASC
    `;
    return result.map((row) => ({
      id: row.id,
      member: { name: row.member_name, avatarId: row.memberAvatarId },
      type: row.type,
      amount: Number(row.amount),
      date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
      status: row.status,
      reason: row.reason ?? undefined,
    })) as Transaction[];
  } catch (error) {
    handleDatabaseError(error, "getTransactionsByAccountNumber");
    return [];
  }
}

// Savings Accounts
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, member_id as "memberId", member_name as "memberName",
        account_number as "accountNumber", type, balance,
        account_name as "accountName", open_date as "openDate"
      FROM savings_accounts
      WHERE group_id = ${groupId}
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

// General Pool Account — IT-configurable account that mirrors total member savings
export async function getGeneralPoolAccount(): Promise<SavingsAccount | null> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      SELECT id, member_id as "memberId", member_name as "memberName",
             account_number as "accountNumber", type, balance,
             account_name as "accountName", open_date as "openDate", is_general_pool as "isGeneralPool"
      FROM savings_accounts
      WHERE group_id = ${groupId} AND is_general_pool = true
      LIMIT 1
    `;
    if (result.length === 0) return null;
    const row = result[0];
    return {
      id: row.id,
      memberId: row.memberId || undefined,
      memberName: row.memberName || undefined,
      accountNumber: row.accountNumber,
      type: row.type,
      balance: Number(row.balance),
      accountName: row.accountName || undefined,
      openDate: row.openDate instanceof Date ? row.openDate.toISOString().split("T")[0] : row.openDate,
    } as SavingsAccount;
  } catch (error) {
    handleDatabaseError(error, "getGeneralPoolAccount");
    return null;
  }
}

export async function setGeneralPoolAccount(accountId: string | null): Promise<void> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    // Unset any existing pool account for this group
    await sql`UPDATE savings_accounts SET is_general_pool = false WHERE group_id = ${groupId}`;
    // Set the new one (if provided)
    if (accountId) {
      await sql`UPDATE savings_accounts SET is_general_pool = true WHERE id = ${accountId} AND group_id = ${groupId}`;
    }
    revalidatePath("/");
    revalidatePath("/admin");
  } catch (error) {
    handleDatabaseError(error, "setGeneralPoolAccount");
    throw error;
  }
}

export async function updateGeneralPoolBalance(delta: number): Promise<void> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    await sql`
      UPDATE savings_accounts
      SET balance = balance + ${delta}, updated_at = CURRENT_TIMESTAMP
      WHERE group_id = ${groupId} AND is_general_pool = true
    `;
  } catch (error) {
    // Non-fatal: pool sync failure should not block the main transaction
    console.error("[pool] Failed to update general pool balance:", error);
  }
}

export async function creditSavingsAccountByNumber(accountNumber: string, delta: number): Promise<boolean> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      UPDATE savings_accounts
      SET balance = balance + ${delta}, updated_at = CURRENT_TIMESTAMP
      WHERE group_id = ${groupId} AND account_number = ${accountNumber}
      RETURNING id
    `;
    return result.length > 0;
  } catch (error) {
    console.error("[pool] Failed to credit savings account by number:", error);
    return false;
  }
}

export async function updateSavingsAccount(
  memberId: string,
  amount: number,
  accountNumber?: string
): Promise<SavingsAccount> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();

    const member = await getMemberById(memberId);
    if (!member) throw new Error("Member not found");

    const existingAccounts = await sql`
      SELECT * FROM savings_accounts
      WHERE member_id = ${member.id} AND group_id = ${groupId}
      ORDER BY account_number ASC
    `;

    if (existingAccounts.length === 0) {
      const newId = `SAV${Date.now()}`;
      const newAccountNumber = `${member.memberId}01`;

      await sql`
        INSERT INTO savings_accounts (id, member_id, member_name, account_number, type, balance, open_date, group_id)
        VALUES (${newId}, ${member.id}, ${member.name}, ${newAccountNumber}, 'Compulsory', ${amount}, CURRENT_DATE, ${groupId})
      `;

      revalidatePath("/savings");
      return {
        id: newId,
        memberId: member.id,
        memberName: member.name,
        accountNumber: newAccountNumber,
        type: "Compulsory",
        balance: amount,
        openDate: new Date().toISOString().split("T")[0],
      };
    } else {
      let accountToUpdate;

      if (accountNumber) {
        accountToUpdate = existingAccounts.find(acc => acc.account_number === accountNumber);
        if (!accountToUpdate) {
          throw new Error(`Account ${accountNumber} not found for member ${member.memberId}`);
        }
      } else {
        accountToUpdate = existingAccounts[0];
      }

      const newBalance = Number(accountToUpdate.balance) + amount;

      await sql`
        UPDATE savings_accounts
        SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${accountToUpdate.id} AND group_id = ${groupId}
      `;

      revalidatePath("/savings");
      return { ...accountToUpdate, balance: newBalance } as SavingsAccount;
    }
  } catch (error) {
    handleDatabaseError(error, "updateSavingsAccount");
    throw error;
  }
}

export async function createSavingsAccount(
  memberId: string | null,
  type: "Voluntary" | "Internal" | "Compulsory",
  accountName: string
): Promise<SavingsAccount> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();

    let nextAccountNumber: string;
    let memberName: string | undefined;
    let memberDatabaseId: string | null = null;

    if (type === "Internal") {
      const existingInternalAccounts = await sql`
        SELECT account_number FROM savings_accounts
        WHERE type = 'Internal' AND group_id = ${groupId}
        ORDER BY account_number DESC
        LIMIT 1
      `;

      if (existingInternalAccounts.length > 0) {
        const lastAccount = existingInternalAccounts[0].account_number;
        const match = lastAccount.match(/INT(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          nextAccountNumber = `INT${nextNum.toString().padStart(3, '0')}`;
        } else {
          nextAccountNumber = 'INT001';
        }
      } else {
        nextAccountNumber = 'INT001';
      }

      memberName = undefined;
    } else {
      if (!memberId) {
        throw new Error("Member ID is required for Voluntary and Compulsory accounts");
      }

      const member = await getMemberById(memberId);
      if (!member) throw new Error("Member not found");

      memberDatabaseId = member.id;
      memberName = member.name;

      const existingAccounts = await sql`
        SELECT account_number FROM savings_accounts
        WHERE member_id = ${member.id} AND group_id = ${groupId}
        ORDER BY account_number ASC
      `;

      if (existingAccounts.length > 0) {
        let maxSuffix = 0;
        for (const account of existingAccounts) {
          const accountNum = account.account_number;
          const suffix = accountNum.slice(-2);
          const prefix = accountNum.slice(0, -2);
          if (prefix === member.memberId && !isNaN(Number(suffix))) {
            const suffixNum = Number(suffix);
            if (suffixNum > maxSuffix) maxSuffix = suffixNum;
          }
        }
        const nextNum = maxSuffix + 1;
        nextAccountNumber = `${member.memberId}${nextNum.toString().padStart(2, '0')}`;
      } else {
        nextAccountNumber = `${member.memberId}01`;
      }
    }

    const newId = `SAV${Date.now()}`;

    await sql`
      INSERT INTO savings_accounts (
        id, member_id, member_name, account_number, type, balance, account_name, open_date, group_id
      )
      VALUES (
        ${newId}, ${memberDatabaseId}, ${memberName || null}, ${nextAccountNumber}, ${type}, 0, ${accountName}, CURRENT_DATE, ${groupId}
      )
    `;

    revalidatePath("/savings");
    return {
      id: newId,
      memberId: memberDatabaseId || undefined,
      memberName: memberName,
      accountNumber: nextAccountNumber,
      type,
      balance: 0,
      accountName,
      openDate: new Date().toISOString().split("T")[0],
    };
  } catch (error) {
    console.error("createSavingsAccount error:", error);
    handleDatabaseError(error, "createSavingsAccount");
    throw error;
  }
}

// Loans
export async function getLoans(): Promise<Loan[]> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, member_id as "memberId", member_name as "memberName",
        loan_id as "loanId", principal, balance, interest_rate as "interestRate",
        issue_date as "issueDate", due_date as "dueDate", status,
        loan_term as "loanTerm", loan_purpose as "loanPurpose"
      FROM loans
      WHERE group_id = ${groupId}
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
    const groupId = await getGroupId();
    const newId = `LN${Date.now()}`;

    await sql`
      INSERT INTO loans (
        id, member_id, member_name, loan_id, principal, balance, interest_rate,
        issue_date, due_date, status, loan_term, loan_purpose, group_id
      ) VALUES (
        ${newId}, ${loan.memberId}, ${loan.memberName}, ${loan.loanId},
        ${loan.principal}, ${loan.balance}, ${loan.interestRate},
        ${loan.issueDate}, ${loan.dueDate}, ${loan.status},
        ${loan.loanTerm}, ${loan.loanPurpose}, ${groupId}
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
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, member_id as "memberId", member_name as "memberName",
        loan_id as "loanId", principal, balance, interest_rate as "interestRate",
        issue_date as "issueDate", due_date as "dueDate", status,
        loan_term as "loanTerm", loan_purpose as "loanPurpose"
      FROM loans
      WHERE id = ${id} AND group_id = ${groupId}
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
    const groupId = await getGroupId();

    const updateSets: string[] = [];

    if (updates.memberName !== undefined) {
      updateSets.push(`member_name = '${updates.memberName.replace(/'/g, "''")}'`);
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
      updateSets.push(`loan_purpose = '${updates.loanPurpose.replace(/'/g, "''")}'`);
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
      WHERE id = ${id} AND group_id = ${groupId}
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
    const groupId = await getGroupId();
    const result = await sql`
      SELECT id, type, date, description, category, amount
      FROM cashbook_entries
      WHERE group_id = ${groupId}
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
    const groupId = await getGroupId();
    const newId = `${type.slice(0, 3).toUpperCase()}${Date.now()}`;
    const dbType = type === "expenses" ? "expense" : "income";

    await sql`
      INSERT INTO cashbook_entries (id, type, date, description, category, amount, group_id)
      VALUES (${newId}, ${dbType}, ${entry.date}, ${entry.description}, ${entry.category}, ${entry.amount}, ${groupId})
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
    const groupId = await getGroupId();

    const updateSets: string[] = [];

    if (updates.date !== undefined) {
      updateSets.push(`date = '${updates.date}'`);
    }
    if (updates.description !== undefined) {
      updateSets.push(`description = '${updates.description.replace(/'/g, "''")}'`);
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
      WHERE id = ${id} AND group_id = ${groupId}
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
    const groupId = await getGroupId();

    await sql`DELETE FROM cashbook_entries WHERE id = ${id} AND group_id = ${groupId}`;

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
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, name, type, amount_invested as "amountInvested",
        current_value as "currentValue", purchase_date as "purchaseDate",
        return_on_investment as "returnOnInvestment"
      FROM investments
      WHERE group_id = ${groupId}
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
    const groupId = await getGroupId();
    const newId = `INV${Date.now()}`;

    await sql`
      INSERT INTO investments (id, name, type, amount_invested, current_value, purchase_date, return_on_investment, group_id)
      VALUES (${newId}, ${investment.name}, ${investment.type}, ${investment.amountInvested},
              ${investment.currentValue}, ${investment.purchaseDate}, ${investment.returnOnInvestment}, ${groupId})
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
    const groupId = await getGroupId();
    const result = await sql`
      SELECT id, timestamp, user_name, user_avatar_id, action, details
      FROM audit_logs
      WHERE group_id = ${groupId}
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
    const groupId = await getGroupId();
    const newId = `AUD${Date.now()}`;

    await sql`
      INSERT INTO audit_logs (id, timestamp, user_name, user_avatar_id, action, details, group_id)
      VALUES (${newId}, ${log.timestamp}, ${log.user.name}, ${log.user.avatarId}, ${log.action}, ${log.details}, ${groupId})
    `;

    revalidatePath("/audit");
    return { ...log, id: newId };
  } catch (error) {
    handleDatabaseError(error, "addAuditLog");
    throw error;
  }
}

// Super Admin: all audit logs across every group
export async function getSuperAdminAuditLogs(): Promise<
  (AuditLog & { groupName: string })[]
> {
  try {
    await ensureInitialized();
    const session = await auth();
    if ((session?.user as any)?.role !== "SUPER_ADMIN") return [];

    const result = await sql`
      SELECT
        a.id, a.timestamp, a.user_name, a.user_avatar_id, a.action, a.details,
        COALESCE(g.name, 'System') AS group_name
      FROM audit_logs a
      LEFT JOIN groups g ON a.group_id = g.id
      ORDER BY a.timestamp DESC
      LIMIT 1000
    `;
    return result.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      user: { name: row.user_name, avatarId: row.user_avatar_id },
      action: row.action,
      details: row.details,
      groupName: row.group_name,
    }));
  } catch (error) {
    handleDatabaseError(error, "getSuperAdminAuditLogs");
    return [];
  }
}

// Super Admin: all transactions across every group
export async function getSuperAdminTransactions(): Promise<
  (Transaction & { groupName: string })[]
> {
  try {
    await ensureInitialized();
    const session = await auth();
    if ((session?.user as any)?.role !== "SUPER_ADMIN") return [];

    const result = await sql`
      SELECT
        t.id, t.member_name, t.member_avatar_id, t.type, t.amount,
        t.date, t.status, t.reason, t.account_number,
        COALESCE(g.name, 'Unknown') AS group_name
      FROM transactions t
      LEFT JOIN groups g ON t.group_id = g.id
      ORDER BY t.created_at DESC
      LIMIT 1000
    `;
    return result.map((row) => ({
      id: row.id,
      member: { name: row.member_name, avatarId: row.member_avatar_id },
      type: row.type,
      amount: Number(row.amount),
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      status: row.status,
      reason: row.reason ?? undefined,
      groupName: row.group_name,
    }));
  } catch (error) {
    handleDatabaseError(error, "getSuperAdminTransactions");
    return [];
  }
}

// Super Admin: list of all groups for filters
export async function getSuperAdminGroups(): Promise<
  { id: string; name: string }[]
> {
  try {
    await ensureInitialized();
    const session = await auth();
    if ((session?.user as any)?.role !== "SUPER_ADMIN") return [];

    const result = await sql`SELECT id, name FROM groups ORDER BY name`;
    return result.map((row) => ({ id: row.id, name: row.name }));
  } catch (error) {
    handleDatabaseError(error, "getSuperAdminGroups");
    return [];
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
    return { accounts: [], journalEntries: [] };
  } catch (error) {
    handleDatabaseError(error, "getAccounting");
    return { accounts: [], journalEntries: [] };
  }
}

export async function updateAccounting(data: AccountingData): Promise<void> {
  try {
    await ensureInitialized();
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
    console.log(`Updating account ${accountId} balance to ${newBalance}`);
  } catch (error) {
    handleDatabaseError(error, "updateAccountBalance");
    throw error;
  }
}

// Dashboard Stats — real month-over-month calculations, scoped to current group
export async function getDashboardStats() {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];

    const [thisMonthSavings, lastMonthSavings] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Deposit' AND date >= ${startOfThisMonth} AND group_id = ${groupId}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Deposit' AND date >= ${startOfLastMonth} AND date <= ${endOfLastMonth} AND group_id = ${groupId}`,
    ]);

    const [thisMonthLoans, lastMonthLoans] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Loan Disbursement' AND date >= ${startOfThisMonth} AND group_id = ${groupId}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Loan Disbursement' AND date >= ${startOfLastMonth} AND date <= ${endOfLastMonth} AND group_id = ${groupId}`,
    ]);

    const loanRisk = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('Overdue', 'Defaulted') THEN balance ELSE 0 END), 0) as at_risk,
        COALESCE(SUM(CASE WHEN status IN ('Active', 'Overdue', 'Defaulted') THEN balance ELSE 0 END), 0) as total_active
      FROM loans
      WHERE group_id = ${groupId}
    `;

    const memberJoins = await sql`
      SELECT
        COUNT(CASE WHEN created_at >= ${startOfThisMonth} THEN 1 END) as this_month,
        COUNT(CASE WHEN created_at >= ${startOfLastMonth} AND created_at < ${startOfThisMonth} THEN 1 END) as last_month
      FROM members
      WHERE status = 'Active' AND group_id = ${groupId}
    `;

    const thisSav = Number(thisMonthSavings[0].total);
    const lastSav = Number(lastMonthSavings[0].total);
    const thisLoan = Number(thisMonthLoans[0].total);
    const lastLoan = Number(lastMonthLoans[0].total);
    const atRisk = Number(loanRisk[0].at_risk);
    const totalActive = Number(loanRisk[0].total_active);
    const thisMembers = Number(memberJoins[0].this_month);
    const lastMembers = Number(memberJoins[0].last_month);

    const pctChange = (current: number, previous: number): string | null => {
      if (previous === 0) return null;
      const pct = ((current - previous) / previous) * 100;
      return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
    };

    return {
      savingsChange: pctChange(thisSav, lastSav),
      loansChange: pctChange(thisLoan, lastLoan),
      portfolioRisk: totalActive > 0 ? ((atRisk / totalActive) * 100).toFixed(1) : "0.0",
      membersChange: pctChange(thisMembers, lastMembers),
    };
  } catch (error) {
    handleDatabaseError(error, "getDashboardStats");
    return { savingsChange: null, loansChange: null, portfolioRisk: "0.0", membersChange: null };
  }
}

// Payments ledger — all financial movements, scoped to current group
export async function getPaymentLedger(): Promise<Transaction[]> {
  try {
    await ensureInitialized();
    const groupId = await getGroupId();
    const result = await sql`
      SELECT
        id, member_name, member_avatar_id as "memberAvatarId",
        type, amount, date, status
      FROM transactions
      WHERE group_id = ${groupId}
      ORDER BY date DESC, created_at DESC
      LIMIT 200
    `;
    return result.map((row) => ({
      id: row.id,
      member: { name: row.member_name, avatarId: row.memberAvatarId },
      type: row.type,
      amount: Number(row.amount),
      date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
      status: row.status,
    })) as Transaction[];
  } catch (error) {
    handleDatabaseError(error, "getPaymentLedger");
    return [];
  }
}
