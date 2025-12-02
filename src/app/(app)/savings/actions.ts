'use server';

import { z } from 'zod';
import { getMemberById, updateMember, updateSavingsAccount, addTransaction } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/lib/types';

const TransactionSchema = z.object({
    memberId: z.string().min(1, 'Member is required.'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    account: z.string().optional(), // Optional account number
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

        const { memberId, amount, account } = parsed.data;
        const transactionAmount = type === 'Deposit' ? amount : -amount;

        // Try to find member by memberId field (e.g., BIF001)
        const member = await getMemberById(memberId);
        if (!member) {
            return { 
                message: `Member ID '${memberId}' not found in the system. Please verify the Member ID is correct.`, 
                fields: { memberId: 'Member not found' },
                success: false 
            };
        }

        if (type === 'Withdrawal' && member.savingsBalance < amount) {
             return { message: 'Insufficient savings balance for this withdrawal.', success: false };
        }

        // 1. Update savings account balance (using database ID and optional account number)
        await updateSavingsAccount(member.id, transactionAmount, account);

        // 2. Update member's total savings balance
        const newSavingsBalance = member.savingsBalance + transactionAmount;
        await updateMember(member.id, { savingsBalance: newSavingsBalance });

        // 3. Add a record to the transaction log
        await addTransaction({
            member: { name: member.name, avatarId: member.avatarId },
            type: type,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
        });

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

export async function makeWithdrawal(prevState: FormState, formData: FormData) {
    return handleTransaction('Withdrawal', prevState, formData);
}

export async function processBulkDeposit(data: any[]) {
    try {
        let successCount = 0;
        let errors: string[] = [];
        let skippedRows = 0;

        // Validate that we have data
        if (!data || data.length === 0) {
            return { success: false, message: "No data found in the uploaded file." };
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
                message: "Invalid file format. Expected columns: 'MEMBER ID', 'ACCOUNT NUMBER', 'AMOUNT', 'REASON'. Please ensure your Excel file has these column headers in the first row." 
            };
        }

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Skip completely empty rows
            const hasAnyData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
            if (!hasAnyData) {
                skippedRows++;
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
                    errors.push(`Row ${i + 1}: Missing Member ID or Amount`);
                } else {
                    skippedRows++;
                }
                continue;
            }

            // Validate amount is a number
            const numericAmount = Number(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                errors.push(`Row ${i + 1}: Invalid amount '${amount}' for member ${memberId}`);
                continue;
            }

            try {
                // Validate member exists
                const member = await getMemberById(String(memberId).trim());
                if (!member) {
                    errors.push(`Row ${i + 1}: Member not found: ${memberId}`);
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
            } catch (error: any) {
                errors.push(`Row ${i + 1}: ${error.message}`);
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
            message 
        };

    } catch (error: any) {
        return { success: false, message: "Server error: " + error.message };
    }
}
