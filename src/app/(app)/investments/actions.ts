'use server';

import { z } from 'zod';
import { addInvestment as addInvestmentToDb } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';

const AddInvestmentSchema = z.object({
  name: z.string().min(1, { message: 'Investment name is required.' }),
  type: z.enum(['Stock', 'Real Estate', 'Bond', 'Agribusiness']),
  amountInvested: z.coerce.number().positive({ message: 'Amount invested must be positive.' }),
  purchaseDate: z.string().min(1, { message: 'Purchase date is required.' }),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
}

export async function addInvestment(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = AddInvestmentSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data.', fields, success: false };
        }

        const { name, type, amountInvested, purchaseDate } = parsed.data;

        await addInvestmentToDb({
            name,
            type,
            amountInvested,
            purchaseDate,
            currentValue: amountInvested, // Initially current value is the invested amount
            returnOnInvestment: 0, // Initially ROI is 0
        });

        revalidatePath('/investments');
        return { message: 'Investment added successfully.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}
