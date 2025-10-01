
'use server';

import { z } from 'zod';
import { addMember as addMemberToDb, updateMember as updateMemberInDb } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/lib/types';


const AddMemberFormSchema = z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    nationalId: z.string().optional(),
    phoneNumber: z.string().min(10, { message: 'Phone number is required.' }),
    email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
    alternativePhone: z.string().optional(),
    address: z.string().optional(),
    savingsGroup: z.string().min(1, { message: 'Savings group is required.' }),
    memberRole: z.enum(['Member', 'Chairperson', 'Treasurer', 'Secretary', 'Teller']),
    monthlyContribution: z.coerce.number().optional(),
    joinDate: z.string().min(1, { message: 'Join date is required.' }),
    // We are not handling file uploads in this action for now
    // profilePhoto: z.any().optional(),
    // nationalIdCopy: z.any().optional(),
});

const EditMemberFormSchema = AddMemberFormSchema.extend({
    id: z.string(),
    status: z.enum(['Active', 'Inactive'])
})

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
        message: 'Invalid form data. Please check the fields.',
        fields,
        success: false
      };
    }
    
    // In a real app, you would handle file uploads here and get back file paths.
    // For now, we'll just use the data.
    // const { profilePhoto, nationalIdCopy, ...memberData } = parsed.data;

    const memberData = parsed.data;

    const newMember: Omit<Member, 'id' | 'memberId' | 'savingsBalance' | 'loanBalance' | 'status' | 'name' | 'avatarId'> = {
        ...memberData,
    };
    
    await addMemberToDb({
      ...newMember,
      name: `${newMember.firstName} ${newMember.lastName}`,
      memberId: `MEM${String(Date.now()).slice(-6)}`,
      savingsBalance: 0,
      loanBalance: 0,
      status: 'Active',
      avatarId: `avatar${Math.floor(Math.random() * 5) + 1}`
    });

    revalidatePath('/members');

    return {
        message: "Member added successfully.",
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

export async function editMember(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = EditMemberFormSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
             for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
            return { message: 'Invalid form data.', fields, success: false };
        }

        const { id, ...updates } = parsed.data;
        await updateMemberInDb(id, {
            ...updates,
            name: `${updates.firstName} ${updates.lastName}`
        });

        revalidatePath('/members');
        return { message: 'Member updated successfully.', success: true };
    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}

export async function deactivateMember(memberId: string): Promise<FormState> {
    try {
        await updateMemberInDb(memberId, { status: 'Inactive' });
        revalidatePath('/members');
        return { message: 'Member has been deactivated.', success: true };
    } catch (e) {
        const error = e as Error;
        return { message: error.message || 'An unexpected error occurred.', success: false };
    }
}
