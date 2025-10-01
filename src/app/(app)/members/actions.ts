
'use server';

import { z } from 'zod';
import { addMember as addMemberToDb } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/lib/types';


const AddMemberFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    memberId: z.string().min(1, { message: 'Member ID is required.' }),
    joinDate: z.string().min(1, { message: 'Join date is required.' }),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
}

export async function addMember(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = AddMemberFormSchema.safeParse(rawData);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const key in parsed.error.format()) {
        if (key !== "_errors") {
            fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
        }
      }
      return {
        message: 'Invalid form data.',
        fields,
        success: false
      };
    }
    
    const newMember: Omit<Member, 'id' | 'savingsBalance' | 'loanBalance' | 'status' | 'avatarId'> = parsed.data;

    await addMemberToDb({
      ...newMember,
      savingsBalance: 0,
      loanBalance: 0,
      status: 'Active',
      avatarId: `avatar${Math.floor(Math.random() * 5) + 1}`
    });

    revalidatePath('/members');

    return {
        message: "Member added successfully",
        success: true,
    }

  } catch (e) {
    const error = e as Error;
    return {
        message: error.message || 'An unexpected error occurred.',
        success: false,
    }
  }
}
