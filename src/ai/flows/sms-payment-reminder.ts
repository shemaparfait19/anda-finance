'use server';

/**
 * @fileOverview An AI agent that determines whether to send an SMS reminder for an upcoming payment due date.
 *
 * - smsPaymentReminder - A function that determines whether to send an SMS reminder.
 * - SMSPaymentReminderInput - The input type for the smsPaymentReminder function.
 * - SMSPaymentReminderOutput - The return type for the smsPaymentReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SMSPaymentReminderInputSchema = z.object({
  memberId: z.string().describe('The ID of the member.'),
  loanId: z.string().describe('The ID of the loan.'),
  dueDate: z.string().describe('The upcoming payment due date (YYYY-MM-DD).'),
  repaymentHistory: z
    .string()
    .describe(
      'A summary of the members repayment history. Include the number of on-time payments, late payments, and any defaults.'
    ),
  configuredReminderSettings: z
    .string()
    .describe('The configured reminder settings for the member.'),
  outstandingBalance: z
    .number()
    .describe('The members outstanding loan balance.'),
});
export type SMSPaymentReminderInput = z.infer<typeof SMSPaymentReminderInputSchema>;

const SMSPaymentReminderOutputSchema = z.object({
  shouldSendReminder: z
    .boolean()
    .describe(
      'Whether or not an SMS reminder should be sent to the member for the upcoming payment.'
    ),
  reason: z.string().describe('The reasoning behind the decision.'),
});
export type SMSPaymentReminderOutput = z.infer<typeof SMSPaymentReminderOutputSchema>;

export async function smsPaymentReminder(
  input: SMSPaymentReminderInput
): Promise<SMSPaymentReminderOutput> {
  return smsPaymentReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smsPaymentReminderPrompt',
  input: {schema: SMSPaymentReminderInputSchema},
  output: {schema: SMSPaymentReminderOutputSchema},
  prompt: `You are an AI assistant that determines whether to send an SMS reminder to a member for an upcoming loan payment.

  Consider the following information about the member, their loan, and their repayment history to make your decision.

  Member ID: {{{memberId}}}
  Loan ID: {{{loanId}}}
  Due Date: {{{dueDate}}}
  Repayment History: {{{repaymentHistory}}}
  Configured Reminder Settings: {{{configuredReminderSettings}}}
  Outstanding Balance: {{{outstandingBalance}}}

  Based on this information, determine whether an SMS reminder should be sent to the member.

  Reason your decision based on the provided information. Be brief and to the point.

  Return the output in JSON format.
  `,
});

const smsPaymentReminderFlow = ai.defineFlow(
  {
    name: 'smsPaymentReminderFlow',
    inputSchema: SMSPaymentReminderInputSchema,
    outputSchema: SMSPaymentReminderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
