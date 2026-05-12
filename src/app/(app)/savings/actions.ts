'use server';

import { z } from 'zod';
import { getMemberById, updateMember, updateSavingsAccount, addTransaction, updateGeneralPoolBalance, creditSavingsAccountByNumber } from '@/lib/data-service';
import { sendMemberPushNotification } from '@/lib/push-notifications';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requiresApproval } from '@/lib/permissions';
import { createPendingAction } from '@/lib/pending-actions-service';
import type { Member, UserRole } from '@/lib/types';

const TransactionSchema = z.object({
    memberId: z.string().optional(),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    account: z.string().optional(),
    debitAccountNumber: z.string().optional(),
    reason: z.string().optional(),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
}

async function handleTransaction(
    type: 'Deposit' | 'Withdrawal',
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    try {
        // Verify session and group isolation before touching any data
        const session = await auth();
        if (!session?.user) return { message: 'Not authenticated.', success: false };
        const groupId = (session.user as any).groupId as string | null;
        if (!groupId) return { message: 'Your account is not associated with a group.', success: false };

        const rawData = Object.fromEntries(formData);
        const parsed = TransactionSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data. Please check all required fields.', fields, success: false };
        }

        const { memberId, amount, account, debitAccountNumber, reason } = parsed.data;
        const transactionAmount = type === 'Deposit' ? amount : -amount;
        const today = new Date().toISOString().split('T')[0];

        // ── Internal account path (no member) ────────────────────────────────
        if (!memberId && account) {
            if (type === 'Withdrawal') {
                return { message: 'Withdrawals from internal accounts are not supported here.', success: false };
            }
            const credited = await creditSavingsAccountByNumber(account, amount);
            if (!credited) {
                return { message: `Account "${account}" not found in your group.`, success: false };
            }
            await addTransaction({
                member: { name: 'Internal Account', avatarId: '' },
                type: 'Deposit',
                amount,
                date: today,
            }, account, reason ?? undefined);

            // Debit the source account if provided (double-entry for internal transfers)
            if (debitAccountNumber?.trim()) {
                const debited = await creditSavingsAccountByNumber(debitAccountNumber.trim(), -amount);
                if (debited) {
                    await addTransaction({
                        member: { name: 'Internal Account', avatarId: '' },
                        type: 'Withdrawal',
                        amount,
                        date: today,
                    }, debitAccountNumber.trim(), `Transfer to ${account}${reason ? ` — ${reason}` : ''}`);
                }
            }

            revalidatePath('/savings');
            revalidatePath('/');
            return { message: `Deposit of RWF ${amount.toLocaleString()} to ${account} successful.`, success: true };
        }

        // ── Member account path ───────────────────────────────────────────────
        if (!memberId) {
            return { message: 'Member is required.', fields: { memberId: 'Member is required.' }, success: false };
        }

        const member = await getMemberById(memberId);
        if (!member) {
            return {
                message: `Member not found or does not belong to your group.`,
                fields: { memberId: 'Member not found' },
                success: false
            };
        }
        // Hard stop: never touch a member from a different group
        if ((member as any).groupId && (member as any).groupId !== groupId) {
            return { message: 'Access denied.', success: false };
        }

        if (type === 'Withdrawal' && member.savingsBalance < amount) {
             return { message: 'Insufficient savings balance for this withdrawal.', success: false };
        }

        // 1. Update savings account balance (using database ID and optional account number)
        await updateSavingsAccount(member.id, transactionAmount, account);

        // 2. Update member's total savings balance
        const newSavingsBalance = member.savingsBalance + transactionAmount;
        await updateMember(member.id, { savingsBalance: newSavingsBalance });

        // 3. Add a record to the transaction log (pass account number for per-account statement)
        await addTransaction({
            member: { name: member.name, avatarId: member.avatarId },
            type: type,
            amount: amount,
            date: today,
        }, account ?? undefined, reason ?? undefined);

        // 4. If a debit account was specified and exists in the system, debit it and
        //    record the matching withdrawal on its statement (double-entry).
        if (type === 'Deposit' && debitAccountNumber?.trim()) {
            const debited = await creditSavingsAccountByNumber(debitAccountNumber.trim(), -amount);
            if (debited) {
                await addTransaction({
                    member: { name: member.name, avatarId: member.avatarId },
                    type: 'Withdrawal',
                    amount,
                    date: today,
                }, debitAccountNumber.trim(), `Transfer to ${account ?? member.memberId}${reason ? ` — ${reason}` : ''}`);
            }
        }

        // Keep General Pool in sync (non-fatal)
        await updateGeneralPoolBalance(transactionAmount);

        // Push notification to member on deposit (non-fatal — fire and forget)
        if (type === 'Deposit') {
            sendMemberPushNotification(
                member.id,
                'Deposit Credited',
                `RWF ${amount.toLocaleString()} deposited${account ? ` to ${account}` : ''}`,
                '/member/savings'
            ).catch(() => {});
        }

        revalidatePath('/savings');
        revalidatePath('/'); // For dashboard totals

        const accountInfo = account ? ` to account ${account}` : '';
        return { message: `${type} of RWF ${amount.toLocaleString()} successful for ${member.name} (${member.memberId})${accountInfo}.`, success: true };

    } catch (e) {
        const error = e as Error;
        console.error(`Transaction error:`, error);
        return { message: error.message || 'An unexpected error occurred. Please try again.', success: false };
    }
}

export async function makeDeposit(prevState: FormState, formData: FormData) {
    return handleTransaction('Deposit', prevState, formData);
}

export async function makeWithdrawal(prevState: FormState, formData: FormData): Promise<FormState> {
    const session = await auth();

    if (session?.user) {
        const role = session.user.role as UserRole;

        if (requiresApproval(role, 'CASH_WITHDRAWAL')) {
            // Validate form data first so we surface errors before queueing
            const parsed = TransactionSchema.safeParse(Object.fromEntries(formData));
            if (!parsed.success) {
                const fields: Record<string, string> = {};
                for (const key in parsed.error.format()) {
                    if (key !== '_errors') fields[key] = (parsed.error.format() as any)[key]?._errors.join(', ');
                }
                return { message: 'Please fix the errors below.', fields, success: false };
            }

            try {
                await createPendingAction('CASH_WITHDRAWAL', { ...parsed.data }, {
                    email:             session.user.email!,
                    name:              session.user.name!,
                    approvalsRequired: session.user.approvalsRequired,
                });
                return {
                    message: 'Withdrawal submitted for approval. A checker must approve it before funds are released.',
                    success: true,
                };
            } catch (e: any) {
                return { message: e.message ?? 'Failed to submit for approval.', success: false };
            }
        }
    }

    return handleTransaction('Withdrawal', prevState, formData);
}

export async function processBulkDeposit(data: any[]) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Not authenticated.', results: [] };
    const groupId = (session.user as any).groupId as string | null;
    if (!groupId) return { success: false, message: 'Your account is not associated with a group.', results: [] };

    try {
        let successCount = 0;
        let errors: string[] = [];
        let skippedRows = 0;
        const results: Array<{
            row: number;
            memberId: string;
            accountNumber: string;
            amount: string;
            status: 'success' | 'failed' | 'skipped';
            error?: string;
        }> = [];

        // Validate that we have data
        if (!data || data.length === 0) {
            return { 
                success: false, 
                message: "No data found in the uploaded file.",
                results: []
            };
        }

        // Check if the file has the expected columns by examining the first row
        const firstRow = data[0];
        const hasExpectedColumns = firstRow && (
            'MEMBER ID' in firstRow || 
            'Member ID' in firstRow || 
            'member id' in firstRow ||
            'memberId' in firstRow
        );

        if (!hasExpectedColumns) {
            return { 
                success: false, 
                message: "Invalid file format. Expected columns: 'MEMBER ID', 'ACCOUNT NUMBER', 'AMOUNT', 'REASON'. Please ensure your Excel file has these column headers in the first row.",
                results: []
            };
        }

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 1;
            
            // Skip completely empty rows
            const hasAnyData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
            if (!hasAnyData) {
                skippedRows++;
                results.push({
                    row: rowNumber,
                    memberId: '',
                    accountNumber: '',
                    amount: '',
                    status: 'skipped',
                    error: 'Empty row'
                });
                continue;
            }

            // Normalize keys to handle case variations or spaces
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
                normalizedRow[normalizedKey] = row[key];
            });

            // Try multiple variations of column names
            const memberId = normalizedRow['MEMBER ID'] || 
                            normalizedRow['MEMBERID'] || 
                            normalizedRow['ID'];
            const accountNumber = normalizedRow['ACCOUNT NUMBER'] || 
                                 normalizedRow['ACCOUNT'] || 
                                 normalizedRow['ACCOUNTNUMBER'];
            const amount = normalizedRow['AMOUNT'] || 
                          normalizedRow['AMT'];
            const reason = normalizedRow['REASON'] || 
                          normalizedRow['DESCRIPTION'] || 
                          normalizedRow['NOTE'] || 
                          'Bulk Deposit';

            // Skip rows with missing critical data
            if (!memberId || !amount) {
                // Only log as error if the row has some data (not just empty cells)
                const rowKeys = Object.keys(row).filter(k => !k.startsWith('_EMPTY'));
                if (rowKeys.length > 0) {
                    const errorMsg = 'Missing Member ID or Amount';
                    errors.push(`Row ${rowNumber}: ${errorMsg}`);
                    results.push({
                        row: rowNumber,
                        memberId: String(memberId || ''),
                        accountNumber: String(accountNumber || ''),
                        amount: String(amount || ''),
                        status: 'failed',
                        error: errorMsg
                    });
                } else {
                    skippedRows++;
                    results.push({
                        row: rowNumber,
                        memberId: '',
                        accountNumber: '',
                        amount: '',
                        status: 'skipped',
                        error: 'Empty row'
                    });
                }
                continue;
            }

            // Validate amount is a number
            const numericAmount = Number(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                const errorMsg = `Invalid amount '${amount}'`;
                errors.push(`Row ${rowNumber}: ${errorMsg}`);
                results.push({
                    row: rowNumber,
                    memberId: String(memberId),
                    accountNumber: String(accountNumber || ''),
                    amount: String(amount),
                    status: 'failed',
                    error: errorMsg
                });
                continue;
            }

            try {
                // Validate member exists
                const member = await getMemberById(String(memberId).trim());
                if (!member) {
                    const errorMsg = `Member not found: ${memberId}`;
                    errors.push(`Row ${rowNumber}: ${errorMsg}`);
                    results.push({
                        row: rowNumber,
                        memberId: String(memberId),
                        accountNumber: String(accountNumber || ''),
                        amount: String(amount),
                        status: 'failed',
                        error: errorMsg
                    });
                    continue;
                }

                // Perform deposit with optional account number
                await updateSavingsAccount(member.id, numericAmount, accountNumber);
                const newSavingsBalance = member.savingsBalance + numericAmount;
                await updateMember(member.id, { savingsBalance: newSavingsBalance });
                await addTransaction({
                    member: { name: member.name, avatarId: member.avatarId },
                    type: 'Deposit',
                    amount: numericAmount,
                    date: new Date().toISOString().split('T')[0],
                });

                successCount++;
                results.push({
                    row: rowNumber,
                    memberId: String(memberId),
                    accountNumber: String(accountNumber || ''),
                    amount: String(amount),
                    status: 'success'
                });
            } catch (error: any) {
                const errorMsg = error.message;
                errors.push(`Row ${rowNumber}: ${errorMsg}`);
                results.push({
                    row: rowNumber,
                    memberId: String(memberId),
                    accountNumber: String(accountNumber || ''),
                    amount: String(amount),
                    status: 'failed',
                    error: errorMsg
                });
            }
        }

        revalidatePath('/savings');
        
        // Build result message
        let message = `Processed ${successCount} deposit(s) successfully.`;
        if (skippedRows > 0) {
            message += ` Skipped ${skippedRows} empty row(s).`;
        }
        if (errors.length > 0) {
            message += ` Failed: ${errors.length}. First errors: ${errors.slice(0, 5).join('; ')}`;
        }
        
        return { 
            success: successCount > 0, 
            message,
            results // Return detailed results
        };

    } catch (error: any) {
        return { 
            success: false, 
            message: "Server error: " + error.message,
            results: []
        };
    }
}
