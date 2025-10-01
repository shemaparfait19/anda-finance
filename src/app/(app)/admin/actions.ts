'use server';

import { smsPaymentReminder, type SMSPaymentReminderOutput } from '@/ai/flows/sms-payment-reminder';
import { z } from 'zod';

const SMSPaymentReminderFormSchema = z.object({
  memberId: z.string().min(1, { message: 'Member ID is required.' }),
  loanId: z.string().min(1, { message: 'Loan ID is required.' }),
  dueDate: z.string().min(1, { message: 'Due date is required.' }),
  repaymentHistory: z.string().min(1, { message: 'Repayment history is required.' }),
  configuredReminderSettings: z.string().min(1, { message: 'Reminder settings are required.' }),
  outstandingBalance: z.coerce.number().min(0, { message: 'Outstanding balance must be a non-negative number.' }),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    result?: SMSPaymentReminderOutput;
}

export async function runSmsPaymentReminder(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = SMSPaymentReminderFormSchema.safeParse(rawData);

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
    
    const result = await smsPaymentReminder(parsed.data);

    return {
        message: "Analysis complete.",
        result,
    }

  } catch (e) {
    const error = e as Error;
    return {
        message: error.message || 'An unexpected error occurred.',
    }
  }
}
