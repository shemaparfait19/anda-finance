
'use server';

import { z } from 'zod';
import { addLoan as addLoanToDb, getMemberById, updateMember, getLoanById, updateLoanInDb, addTransaction } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';
import type { Loan } from '@/lib/types';
import { addMonths, format } from 'date-fns';

const LoanApplicationSchema = z.object({
    memberId: z.string().min(1, { message: 'Member is required.' }),
    amount: z.coerce.number().positive({ message: 'Loan amount must be positive.' }),
    term: z.coerce.number().int().positive({ message: 'Term must be a positive number of months.' }),
    interestRate: z.coerce.number().min(0, { message: 'Interest rate cannot be negative.' }),
    loanPurpose: z.string().min(1, { message: 'Loan purpose is required.' }),
    purposeDescription: z.string().optional(),
});

const RepaymentSchema = z.object({
    loanId: z.string().min(1, 'Loan ID is required.'),
    amount: z.coerce.number().positive('Repayment amount must be positive.'),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
}

export async function applyForLoan(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = LoanApplicationSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data.', fields, success: false };
        }

        const { memberId, amount, term, interestRate, loanPurpose, purposeDescription } = parsed.data;

        const member = await getMemberById(memberId);
        if (!member) {
            return { message: 'Member not found.', success: false };
        }

        const issueDate = new Date();
        const dueDate = addMonths(issueDate, term);

        const newLoanData: Omit<Loan, 'id'> = {
            memberId: member.id,
            memberName: member.name,
            loanId: `LN${String(Date.now()).slice(-6)}`,
            principal: amount,
            balance: amount, // Initially balance is the principal upon approval
            interestRate: interestRate,
            issueDate: format(issueDate, 'yyyy-MM-dd'),
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            status: 'Pending', // New loans are pending approval
            loanTerm: term,
            loanPurpose: loanPurpose,
            purposeDescription: purposeDescription,
        };

        await addLoanToDb(newLoanData);

        revalidatePath('/loans');
        return { message: 'Loan application submitted successfully. It is now pending approval.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}


export async function approveLoan(loanId: string): Promise<FormState> {
    try {
        const loan = await getLoanById(loanId);
        if (!loan) {
            return { message: 'Loan not found.', success: false };
        }
        if (loan.status !== 'Pending') {
             return { message: `Loan is already ${loan.status.toLowerCase()}.`, success: false };
        }

        const member = await getMemberById(loan.memberId);
        if (!member) {
            return { message: 'Associated member not found.', success: false };
        }

        // Update loan status
        await updateLoanInDb(loanId, { status: 'Active' });

        // Update member's loan balance
        await updateMember(member.id, { loanBalance: member.loanBalance + loan.principal });

        // Add a transaction log for disbursement
        await addTransaction({
            member: { name: member.name, avatarId: member.avatarId },
            type: 'Loan Disbursement',
            amount: loan.principal,
            date: new Date().toISOString().split('T')[0],
        });

        revalidatePath('/loans');
        revalidatePath('/'); // For dashboard totals
        revalidatePath(`/members/${member.id}`); // For member profile page

        return { message: 'Loan approved and disbursed successfully.', success: true };
    } catch(e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}

export async function recordRepayment(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = RepaymentSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid repayment data.', fields, success: false };
        }

        const { loanId, amount } = parsed.data;

        const loan = await getLoanById(loanId);
        if (!loan) {
            return { message: 'Loan not found.', success: false };
        }

        const member = await getMemberById(loan.memberId);
        if (!member) {
            return { message: 'Associated member not found.', success: false };
        }

        if (amount > loan.balance) {
            return { message: `Repayment amount cannot exceed the outstanding balance of RWF ${loan.balance.toLocaleString()}.`, success: false };
        }

        const newBalance = loan.balance - amount;
        const newStatus = newBalance <= 0 ? 'Paid' : loan.status;

        // Update loan
        await updateLoanInDb(loanId, { balance: newBalance, status: newStatus });

        // Update member's total loan balance
        await updateMember(member.id, { loanBalance: member.loanBalance - amount });

        // Add transaction log
        await addTransaction({
            member: { name: member.name, avatarId: member.avatarId },
            type: 'Loan Repayment',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
        });

        revalidatePath('/loans');
        revalidatePath('/');
        revalidatePath(`/members/${member.id}`);
        
        return { message: 'Repayment recorded successfully.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}
