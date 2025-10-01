'use server';

import { z } from 'zod';
import { addLoan as addLoanToDb, getMemberById, updateMember } from '@/lib/data-service';
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
            balance: amount, // Initially balance is the principal
            interestRate: interestRate,
            issueDate: format(issueDate, 'yyyy-MM-dd'),
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            status: 'Pending', // New loans are pending approval
            loanTerm: term,
            loanPurpose: loanPurpose,
            purposeDescription: purposeDescription,
        };

        const newLoan = await addLoanToDb(newLoanData);

        // We could also update the member's loanBalance here, but typically that happens upon disbursement, not application.
        // For simplicity, let's assume application means disbursement for now.
        await updateMember(member.id, { loanBalance: member.loanBalance + newLoan.principal });


        revalidatePath('/loans');
        revalidatePath('/'); // For dashboard totals

        return { message: 'Loan application submitted successfully.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}
