
'use server';

import { z } from 'zod';
import {
  addCashbookEntry as addCashbookEntryToDb,
  updateCashbookEntry as updateCashbookEntryInDb,
  deleteCashbookEntry as deleteCashbookEntryFromDb,
  updateGeneralPoolBalance,
  creditSavingsAccountByNumber,
  addTransaction,
} from '@/lib/data-service';
import { revalidatePath } from 'next/cache';

const EntrySchema = z.object({
  type: z.enum(['income', 'expenses']),
  date: z.string().min(1, { message: 'Date is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateEntrySchema = EntrySchema.extend({
    id: z.string().min(1),
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
        const parsed = EntrySchema.safeParse(rawData);

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


export async function updateCashbookEntry(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = UpdateEntrySchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data.', fields, success: false };
        }
        
        const { type, id, ...updates } = parsed.data;

        await updateCashbookEntryInDb(type, id, updates);

        revalidatePath('/accounting');
        return { message: 'Cashbook entry updated successfully.', success: true };

    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}

const LoadInternalSchema = z.object({
  transactionType: z.string().min(1, 'Transaction type is required.'),
  accountNumber: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive.'),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
});

export async function loadInternalAccount(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const parsed = LoadInternalSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const key in parsed.error.format()) {
        if (key !== '_errors') fields[key] = (parsed.error.format() as any)[key]?._errors.join(', ');
      }
      return { message: 'Invalid form data.', fields, success: false };
    }

    const { transactionType, accountNumber, amount, paymentMethod, description } = parsed.data;

    // Credit the specified account first — fail early before writing cashbook
    if (accountNumber) {
      const credited = await creditSavingsAccountByNumber(accountNumber, amount);
      if (!credited) {
        return { message: `Account number "${accountNumber}" not found in your group.`, success: false };
      }
    } else {
      await updateGeneralPoolBalance(amount);
    }

    // Auto-generate short transaction ID, format: TYPE-TxnID-Description
    const txnId = Date.now().toString(36).toUpperCase();
    const tracedDescription = description
      ? `${transactionType}-${txnId}-${description}`
      : `${transactionType}-${txnId}`;

    const today = new Date().toISOString().split('T')[0];

    // Record as cashbook income entry
    await addCashbookEntryToDb('income', {
      date: today,
      description: tracedDescription,
      category: transactionType,
      amount,
      paymentMethod,
      reference: accountNumber ?? undefined,
    });

    // Also write a savings transaction so the account statement shows this load
    if (accountNumber) {
      await addTransaction({
        member: { name: transactionType, avatarId: '' },
        type: 'Deposit',
        amount,
        date: today,
      }, accountNumber, tracedDescription);
    }

    revalidatePath('/accounting');
    revalidatePath('/payments');
    revalidatePath('/savings');
    revalidatePath('/');
    return {
      message: `RWF ${amount.toLocaleString()} loaded. ID: ${transactionType}-${txnId}`,
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    return { message: error.message || 'An unexpected error occurred.', success: false };
  }
}

export async function deleteCashbookEntry(type: 'income' | 'expenses', id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await deleteCashbookEntryFromDb(type, id);
        revalidatePath('/accounting');
        return { success: true, message: 'Entry deleted successfully.' };
    } catch(e) {
        const error = e as Error;
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}
