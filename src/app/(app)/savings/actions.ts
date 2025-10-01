'use server';

import { z } from 'zod';
import { getMemberById, updateMember, updateSavingsAccount, addTransaction } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/lib/types';

const TransactionSchema = z.object({
    memberId: z.string().min(1, 'Member is required.'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
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
            return { message: 'Invalid form data.', fields, success: false };
        }

        const { memberId, amount } = parsed.data;
        const transactionAmount = type === 'Deposit' ? amount : -amount;

        const member = await getMemberById(memberId);
        if (!member) {
            return { message: 'Member not found.', success: false };
        }

        if (type === 'Withdrawal' && member.savingsBalance < amount) {
             return { message: 'Insufficient savings balance for this withdrawal.', success: false };
        }

        // 1. Update savings account balance
        await updateSavingsAccount(memberId, transactionAmount);

        // 2. Update member's total savings balance
        const newSavingsBalance = member.savingsBalance + transactionAmount;
        await updateMember(memberId, { savingsBalance: newSavingsBalance });

        // 3. Add a record to the transaction log
        await addTransaction({
            member: { name: member.name, avatarId: member.avatarId },
            type: type,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
        });

        revalidatePath('/savings');
        revalidatePath('/'); // For dashboard totals

        return { message: `${type} successful.`, success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}

export async function makeDeposit(prevState: FormState, formData: FormData) {
    return handleTransaction('Deposit', prevState, formData);
}

export async function makeWithdrawal(prevState: FormState, formData: FormData) {
    return handleTransaction('Withdrawal', prevState, formData);
}
