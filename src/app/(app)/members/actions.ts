
'use server';

import { z } from 'zod';

const AddMemberFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    memberId: z.string().min(1, { message: 'Member ID is required.' }),
    joinDate: z.string().min(1, { message: 'Join date is required.' }),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
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
        fields
      };
    }
    
    // Here you would typically save the data to your database.
    // For this demo, we'll just log it to the console.
    console.log('New member added (simulated):', parsed.data);

    // Revalidate path if you were fetching data, to refetch and show the new member.
    // revalidatePath('/members');

    return {
        message: "Member added successfully",
    }

  } catch (e) {
    const error = e as Error;
    return {
        message: error.message || 'An unexpected error occurred.',
    }
  }
}
