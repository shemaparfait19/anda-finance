'use server';

import { z } from 'zod';
import { addCashbookEntry as addCashbookEntryToDb } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';

const AddEntrySchema = z.object({
  type: z.enum(['income', 'expenses']),
  date: z.string().min(1, { message: 'Date is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
}

export async function addCashbookEntry(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = AddEntrySchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data.', fields, success: false };
        }

        const { type, ...entryData } = parsed.data;

        await addCashbookEntryToDb(type, entryData);

        revalidatePath('/accounting');
        return { message: 'Cashbook entry added successfully.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}
